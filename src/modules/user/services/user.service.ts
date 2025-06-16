import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Not, Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';
import { RecoveryStatusService } from '@modules/user/services/recovery-status.service';
import { UpdateProfileDto } from '../dtos/update-user.dto';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';
import { AchievementsService } from '@modules/achievements/services/achievements.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Profile)
    private readonly userRepository: Repository<Profile>,
    private readonly recovery: RecoveryStatusService,
    private readonly firebaseService: FirebaseService,
    private readonly achievementsService: AchievementsService,
  ) {}

  async createUser(input: CreateUserDTO): Promise<any> {
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser)
      throw new Error('User already exists in internal database');

    if (input.birthdayDate) {
      input.birthdayDate = new Date(input.birthdayDate);
    }

    if (!input.username) {
      input.username = this.gerarUsernameAnonimo();
    }

    const newUser: UserRecord = await this.firebaseService.createUser({
      email: input.email,
      password: input.password,
    });

    const user = this.userRepository.create({
      ...input,
      firebaseUid: newUser.uid,
    });
    const savedUser = await this.userRepository.save(user);

    await this.recovery.markRelapse(savedUser.firebaseUid);

    // Initialize achievement tracking for the new user
    try {
      await this.achievementsService.initializeUserAchievements(savedUser.id);
    } catch (error) {
      console.error('Error initializing user achievements:', error);
      // Don't throw error - user creation should succeed even if achievement initialization fails
    }

    return newUser;
  }

  async createUserFromFirebase(
    firebaseUid: string,
    email: string,
    displayName?: string,
    photoURL?: string,
  ): Promise<Profile> {
    try {
      // Verifica se o usuário já existe no banco
      const existingUser = await this.findUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        return existingUser;
      }

      // Gera username único
      const username = displayName
        ? await this.generateUniqueUsername(displayName)
        : this.gerarUsernameAnonimo();

      // Cria o usuário no banco de dados local
      const user = this.userRepository.create({
        firebaseUid,
        email,
        username,
        avatar: photoURL,
        // Outros campos opcionais podem ser definidos posteriormente
      });

      const savedUser = await this.userRepository.save(user);

      // Marca como primeira vez no sistema de recuperação
      await this.recovery.markRelapse(firebaseUid);

      // Initialize achievement tracking for the new user
      try {
        await this.achievementsService.initializeUserAchievements(savedUser.id);
      } catch (error) {
        console.error('Error initializing user achievements:', error);
        // Don't throw error - user creation should succeed even if achievement initialization fails
      }

      return savedUser;
    } catch (error) {
      console.error('Erro ao criar usuário do Firebase:', error);
      throw new Error(`Failed to create user from Firebase: ${error.message}`);
    }
  }

  async createUserFromGoogle(
    firebaseUid: string,
    googleUid: string,
    email: string,
    displayName?: string,
    photoURL?: string,
  ): Promise<Profile> {
    try {
      // Verifica se o usuário já existe no banco pelo firebaseUid OU googleUid OU email
      let existingUser = await this.findUserByFirebaseUid(firebaseUid);
      if (existingUser) {
        console.log('✅ Usuário encontrado pelo Firebase UID');
        return existingUser;
      }

      // Se não encontrou pelo firebaseUid, tenta pelo googleUid
      existingUser = await this.findUserByGoogleUid(googleUid);
      if (existingUser) {
        console.log(
          '✅ Usuário encontrado pelo Google UID, atualizando Firebase UID',
        );
        // Se encontrou pelo googleUid mas não tem firebaseUid, atualiza
        if (!existingUser.firebaseUid) {
          existingUser.firebaseUid = firebaseUid;
          await this.userRepository.save(existingUser);
        }
        return existingUser;
      }

      // Como último recurso, verifica pelo email (caso de migração/inconsistência)
      existingUser = await this.findUserByEmail(email);
      if (existingUser) {
        console.log('✅ Usuário encontrado pelo email, atualizando IDs');
        // Atualiza os IDs que estão faltando
        if (!existingUser.firebaseUid) existingUser.firebaseUid = firebaseUid;
        if (!existingUser.googleUid) existingUser.googleUid = googleUid;
        await this.userRepository.save(existingUser);
        return existingUser;
      }

      console.log('📝 Criando novo usuário Google...');

      // Gera username único baseado no displayName ou email
      const baseUsername = displayName || email.split('@')[0];
      const username = await this.generateUniqueUsername(baseUsername);

      // Separa primeiro e último nome se displayName existir
      let firstName: string, lastName: string;
      if (displayName) {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || undefined;
      }

      // Cria o usuário no banco de dados local
      const user = this.userRepository.create({
        firebaseUid, // Firebase UID (principal identificador)
        googleUid, // Google UID (para referência)
        email,
        username,
        firstName,
        lastName,
        avatar: photoURL,
      });

      const savedUser = await this.userRepository.save(user);

      // Marca como primeira vez no sistema de recuperação (usando Firebase UID)
      await this.recovery.markRelapse(firebaseUid);

      // Initialize achievement tracking for the new user
      try {
        await this.achievementsService.initializeUserAchievements(savedUser.id);
      } catch (error) {
        console.error('Error initializing user achievements:', error);
        // Don't throw error - user creation should succeed even if achievement initialization fails
      }

      return savedUser;
    } catch (error) {
      console.error('Erro ao criar usuário do Google:', error);
      throw new Error(`Failed to create user from Google: ${error.message}`);
    }
  }

  async findUserByEmail(email: string): Promise<Profile> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserByFirebaseUid(id: string): Promise<Profile> {
    return await this.userRepository.findOne({ where: { firebaseUid: id } });
  }

  async findUserByGoogleUid(googleUid: string): Promise<Profile> {
    if (!googleUid) {
      return null;
    }
    return await this.userRepository.findOne({ where: { googleUid } });
  }

  async findByIdOrThrow(profileId: string) {
    return await this.userRepository.findOneOrFail({
      where: { id: profileId },
    });
  }

  async findAll(firebase: string): Promise<Profile[]> {
    return await this.userRepository.find({
      where: {
        isPrivate: false,
        firebaseUid: Not(firebase),
      },
    });
  }

  /**
   * Buscar informações básicas de um usuário por ID
   */
  async getUserBasicInfo(userId: string): Promise<any> {
    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('Usuário não encontrado');
    }

    return {
      id: user.id,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      foto: user.avatar,
      displayName:
        `${user.firstName || ''} ${user.lastName || ''}`.trim() ||
        user.username,
    };
  }

  async updateProfile(
    firebaseUid: string,
    updateDto: UpdateProfileDto,
    avatarFile?: Express.Multer.File,
  ): Promise<Profile> {
    const profile = await this.userRepository.findOne({
      where: { firebaseUid },
    });

    if (!profile) throw new NotFoundException('Profile not found');

    if (avatarFile) {
      const avatarUrl = await this.firebaseService.uploadImage(
        avatarFile,
        'avatars',
      );
      profile.avatar = avatarUrl;
    }

    Object.assign(profile, updateDto);

    return this.userRepository.save(profile);
  }

  async getUserDetails(userId: string, firebaseUid: string) {
    const profile: Profile = await this.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new Error('Profile not found!');
    }
    const result = await this.userRepository.findOne({
      where: { id: userId },
    });

    return result;
  }

  async saveUserAvatar(firebaseUid: string, file: any) {
    const profile: Profile = await this.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new Error('Profile not found!');
    }
    const imageUrl = await this.firebaseService.uploadImage(file, 'avatars');
    profile.avatar = imageUrl;
    this.userRepository.save(profile);
  }

  /**
   * Gera um username único baseado em um valor base
   */
  async generateUniqueUsername(baseUsername: string): Promise<string> {
    // Remove caracteres especiais e espaços, deixa apenas letras e números
    const cleanUsername = baseUsername
      .replace(/[^a-zA-Z0-9]/g, '')
      .toLowerCase();

    // Se ficou muito pequeno ou vazio, gera um anônimo
    if (cleanUsername.length < 3) {
      return this.gerarUsernameAnonimo();
    }

    // Tenta o username original primeiro
    let candidateUsername = cleanUsername;
    let counter = 1;

    while (true) {
      // Verifica se o username já existe
      const existingUser = await this.userRepository.findOne({
        where: { username: candidateUsername },
      });

      if (!existingUser) {
        return candidateUsername;
      }

      // Se já existe, adiciona um número
      candidateUsername = `${cleanUsername}${counter}`;
      counter++;

      // Se passar de 999 tentativas, gera um username anônimo
      if (counter > 999) {
        return this.gerarUsernameAnonimo();
      }
    }
  }

  gerarUsernameAnonimo(): string {
    const adjetivos = [
      'Anonimo',
      'Misterioso',
      'Silencioso',
      'Valente',
      'Astuto',
      'Corajoso',
      'Gentil',
      'Sábio',
      'Esperto',
      'Veloz',
      'Pacífico',
      'Brilhante',
      'Vibrante',
      'Oculto',
      'Noturno',
      'Invisível',
      'Sutil',
      'Feroz',
      'Solitário',
      'Alegre',
      'Tranquilo',
      'Engraçado',
      'Sereno',
      'Leal',
      'Audaz',
      'Radiante',
      'Singelo',
      'Cauteloso',
      'Sombrio',
      'Estelar',
      'Curioso',
      'Criativo',
      'Exótico',
      'Lendário',
      'Raro',
      'Neutro',
      'Distante',
      'Calmo',
      'Ágil',
      'Nômade',
      'Leve',
      'Magnífico',
      'Brando',
      'Viajante',
      'Ocidental',
      'Sábio',
      'Fugaz',
      'Eterno',
      'Doce',
      'Gentil',
    ];

    const substantivos = [
      'Leão',
      'Coruja',
      'Tigre',
      'Lobo',
      'Dragão',
      'Falcão',
      'Pantera',
      'Urso',
      'Cervo',
      'Raposa',
      'Águia',
      'Gavião',
      'Serpente',
      'Cavalo',
      'Gato',
      'Cão',
      'Búfalo',
      'Camaleão',
      'Jacaré',
      'Coelho',
      'Pinguim',
      'Tubarão',
      'Polvo',
      'Golfinho',
      'Tigre',
      'Gorila',
      'Zebra',
      'Macaco',
      'Rinoceronte',
      'Elefante',
      'Estrela',
      'Lua',
      'Cometa',
      'Meteoro',
      'Montanha',
      'Oceano',
      'Tempestade',
      'Rochedo',
      'Selva',
      'Deserto',
      'Vento',
      'Relâmpago',
      'Neve',
      'Chama',
      'Fumaça',
      'Raio',
      'Areia',
      'Folha',
      'Flor',
      'Pedra',
    ];

    const numero = Math.floor(Math.random() * 1000); // Gera número entre 0-999

    const adjetivo = adjetivos[Math.floor(Math.random() * adjetivos.length)];
    const substantivo =
      substantivos[Math.floor(Math.random() * substantivos.length)];

    return `${adjetivo}${substantivo}${numero}`;
  }
}

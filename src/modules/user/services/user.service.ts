import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';
import { RecoveryStatusService } from '@modules/user/services/recovery-status.service';
import { UpdateProfileDto } from '../dtos/update-user.dto';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Profile)
    private readonly userRepository: Repository<Profile>,
    private readonly recovery: RecoveryStatusService,
    private readonly firebaseService: FirebaseService,
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
    await this.userRepository.save(user);

    await this.recovery.markRelapse(user.firebaseUid);

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

      // Gera username anônimo se não tiver displayName
      const username = displayName || this.gerarUsernameAnonimo();

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

      return savedUser;
    } catch (error) {
      console.error('Erro ao criar usuário do Firebase:', error);
      throw new Error(`Failed to create user from Firebase: ${error.message}`);
    }
  }

  async createUserFromGoogle(
    googleUid: string,
    email: string,
    displayName?: string,
    photoURL?: string,
  ): Promise<Profile> {
    try {
      // Verifica se o usuário já existe no banco pelo googleUid
      const existingUser = await this.findUserByGoogleUid(googleUid);
      if (existingUser) {
        return existingUser;
      }

      // Gera username baseado no displayName ou email
      const username =
        displayName || email.split('@')[0] || this.gerarUsernameAnonimo();

      // Separa primeiro e último nome se displayName existir
      let firstName: string, lastName: string;
      if (displayName) {
        const nameParts = displayName.split(' ');
        firstName = nameParts[0];
        lastName = nameParts.slice(1).join(' ') || undefined;
      }

      // Cria o usuário no banco de dados local
      const user = this.userRepository.create({
        googleUid,
        email,
        username,
        firstName,
        lastName,
        avatar: photoURL,
      });

      const savedUser = await this.userRepository.save(user);

      // Marca como primeira vez no sistema de recuperação
      await this.recovery.markRelapse(googleUid);

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
    return await this.userRepository.findOne({ where: { googleUid } });
  }

  async findByIdOrThrow(profileId: string) {
    return await this.userRepository.findOneOrFail({
      where: { id: profileId },
    });
  }

  async findAll(): Promise<Profile[]> {
    return await this.userRepository.find();
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

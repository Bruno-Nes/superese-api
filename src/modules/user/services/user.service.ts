import { Injectable, NotFoundException } from '@nestjs/common';
import { Profile } from '../entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';
import { RecoveryStatusService } from '@modules/user/services/recovery-status.service';
import { UpdateProfileDto } from '../dtos/update-user.dto';

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

    const newUser = await this.firebaseService.createUser({
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

  async findUserByEmail(email: string): Promise<Profile> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findUserByFirebaseUid(id: string): Promise<Profile> {
    return await this.userRepository.findOne({ where: { firebaseUid: id } });
  }

  async findByIdOrThrow(profileId: string) {
    return await this.userRepository.findOneOrFail({
      where: { id: profileId },
    });
  }

  async findAll(): Promise<Profile[]> {
    return await this.userRepository.find();
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

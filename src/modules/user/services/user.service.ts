import { Injectable } from '@nestjs/common';
import { Profile } from '../entities/profile.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(Profile)
    private readonly userRepository: Repository<Profile>,
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

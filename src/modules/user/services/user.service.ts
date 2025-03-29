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
}

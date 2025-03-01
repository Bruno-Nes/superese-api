import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async createUser(input: CreateUserDTO): Promise<User> {
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser) throw new Error('User already exists');

    if (input.birthdayDate) {
      input.birthdayDate = new Date(input.birthdayDate);
    }

    const user = this.userRepository.create(input);
    return (await this.userRepository.insert(user)).raw;
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }
}

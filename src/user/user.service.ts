import { Injectable } from '@nestjs/common';
import { User } from './entity/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from './dtos/create-user.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(input: CreateUserDTO): Promise<User> {
    const user = this.userRepository.create(input);
    return await this.userRepository.save(user);
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }
}

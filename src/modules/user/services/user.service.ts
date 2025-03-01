import { Injectable } from '@nestjs/common';
import { User } from '../entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { JwtService } from '@nestjs/jwt';
import { RegisteredUser } from '../dtos/registered-user-response.dto';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
  ) {}

  async createUser(input: CreateUserDTO): Promise<RegisteredUser> {
    const existingUser = await this.findUserByEmail(input.email);
    if (existingUser) throw new Error('User already exists');

    if (input.birthdayDate) {
      input.birthdayDate = new Date(input.birthdayDate);
    }

    const user = this.userRepository.create(input);
    const savedUser = await this.userRepository.save(user);
    const payload = { username: savedUser.email, sub: user.id };
    return {
      access_token: await this.jwtService.signAsync(payload),
    };
  }

  async findUserByEmail(email: string): Promise<User> {
    return await this.userRepository.findOne({ where: { email } });
  }

  async findAll(): Promise<User[]> {
    return await this.userRepository.find();
  }
}

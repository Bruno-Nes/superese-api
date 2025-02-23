import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  UseFilters,
  Body,
  Get,
} from '@nestjs/common';
import { UserService } from '../user.service';
import { DuplicateKeyExceptionFilter } from 'src/shared/exception-filters/duplicate-key.exception-filter';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { User } from '../entity/user.entity';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @UseFilters(DuplicateKeyExceptionFilter)
  async createUser(@Body() data: CreateUserDTO): Promise<void> {
    await this.userService.createUser(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getUsers() {
    await this.userService.findAll();
  }
}

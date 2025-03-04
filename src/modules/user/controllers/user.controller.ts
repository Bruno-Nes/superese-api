import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Get,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { RegisteredUser } from '../dtos/registered-user-response.dto';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  async createUser(@Body() data: CreateUserDTO): Promise<RegisteredUser> {
    return await this.userService.createUser(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @Public()
  async getUsers() {
    return await this.userService.findAll();
  }
}

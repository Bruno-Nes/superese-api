import {
  Controller,
  Post,
  HttpCode,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Get,
  Logger,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('users')
export class UserController {
  private logger: Logger;
  constructor(private readonly userService: UserService) {
    this.logger = new Logger(UserController.name);
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(ClassSerializerInterceptor)
  @ApiOperation({ summary: 'Cria um novo usuário' })
  @ApiResponse({
    status: 201,
    description: 'Usuário criado com sucesso',
  })
  @ApiResponse({ status: 400, description: 'Dados inválidos' })
  @ApiBody({ type: CreateUserDTO })
  async createUser(@Body() data: CreateUserDTO): Promise<any> {
    this.logger.debug(data);
    return await this.userService.createUser(data);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Lista de usuários retornada com sucesso',
  })
  async getUsers() {
    return await this.userService.findAll();
  }
}

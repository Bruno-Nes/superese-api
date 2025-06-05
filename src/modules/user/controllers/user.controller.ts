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
  Request,
  Param,
  UseGuards,
  UploadedFile,
  Patch,
} from '@nestjs/common';
import { UserService } from '../services/user.service';
import { CreateUserDTO } from '../dtos/create-user.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from 'src/lib/decorators/public-route.decorators';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { FileInterceptor } from '@nestjs/platform-express';
import { UpdateProfileDto } from '../dtos/update-user.dto';

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

  @Get('get-user/:id')
  @UseGuards(AuthGuard)
  async findUserById(@Param('id') userId: string, @Request() request: any) {
    const firebaseUserId = request.user.uid;
    return this.userService.getUserDetails(userId, firebaseUserId);
  }

  @Patch()
  @UseInterceptors(FileInterceptor('avatar'))
  async updateProfile(
    @Request() request: any,
    @Body() updateDto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const firebaseUserId = request.user.uid;
    const updated = await this.userService.updateProfile(
      firebaseUserId,
      updateDto,
      file,
    );
    return { message: 'Perfil atualizado com sucesso', profile: updated };
  }

  @Get('me')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Lista todos os usuários' })
  @ApiResponse({
    status: 200,
    description: 'Retorna dados do usuario logado',
  })
  @UseGuards(AuthGuard)
  async getMe(@Request() request: any) {
    const firebaseUserId = request.user.uid;
    return await this.userService.findUserByFirebaseUid(firebaseUserId);
  }

  @Get(':userId')
  @UseGuards(AuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Buscar usuário por ID' })
  @ApiResponse({
    status: 200,
    description: 'Retorna dados básicos do usuário',
  })
  async getUserById(@Param('userId') userId: string) {
    return await this.userService.getUserBasicInfo(userId);
  }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginUserDTO } from '../dtos/login-user.dto';
import { GoogleLoginDTO } from '../dtos/google-login.dto';
import { Public } from 'src/lib/decorators/public-route.decorators';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('auth')
@ApiTags('Autenticação')
export class AuthController {
  private logger: Logger;
  constructor(private authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login do usuário',
    description:
      'Realiza login e cria automaticamente o usuário no banco se não existir',
  })
  @ApiResponse({
    status: 200,
    description: 'Login realizado com sucesso',
    schema: {
      properties: {
        idToken: { type: 'string' },
        refreshToken: { type: 'string' },
        expiresIn: { type: 'string' },
        user: { type: 'object' },
      },
    },
  })
  async login(@Body() request: LoginUserDTO) {
    return this.authService.login(request);
  }

  @Post('google')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login com Google',
    description:
      'Realiza login com Google OAuth e cria automaticamente o usuário no banco se não existir',
  })
  @ApiResponse({
    status: 200,
    description: 'Login com Google realizado com sucesso',
    schema: {
      properties: {
        accessToken: { type: 'string' },
        user: { type: 'object' },
        provider: { type: 'string', example: 'google' },
      },
    },
  })
  async googleLogin(@Body() request: GoogleLoginDTO) {
    return this.authService.googleLogin(request);
  }
}

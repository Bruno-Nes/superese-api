import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Logger,
  Post,
} from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginDTO } from '@modules/user/dtos/login.dto';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('auth')
export class AuthController {
  private logger: Logger;
  constructor(private authService: AuthService) {
    this.logger = new Logger(AuthController.name);
  }

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
  async login(@Body() request: LoginDTO) {
    this.logger.debug(request);
    return this.authService.login(request);
  }

  // @Get('google')
  // @UseGuards(AuthGuard('google'))
  // async googleAuth(@Req() req) {}

  // @Get('google/callback')
  // @UseGuards(AuthGuard('google'))
  // async googleAuthRedirect(@Req() req) {
  //   return req.user;
  // }
}

import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../auth.service';
import { Public } from 'src/lib/decorators/public-route.decorators';
import { LoginDTO } from '@modules/user/dtos/login.dto';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @Public()
  @UseGuards(LocalAuthGuard)
  async login(@Body() request: LoginDTO) {
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

import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { LoginDTO } from '@modules/user/dtos/login.dto';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  @Public()
  @HttpCode(HttpStatus.OK)
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

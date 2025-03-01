import {
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { LocalAuthGuard } from '../guards/local-auth.guard';
import { AuthService } from '../auth.service';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  @Post()
  @HttpCode(HttpStatus.OK)
  @UseGuards(LocalAuthGuard)
  async login(@Request() req: any) {
    return this.authService.login(req.user);
  }
}

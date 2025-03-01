import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserAuth } from './interfaces/user.interface';
import { UserService } from '@modules/user/services/user.service';

export interface UserPayload {
  sub: string;
  email: string;
  name: string;
  isTempPassword: boolean;
  iat?: number;
  exp?: number;
}

@Injectable()
export class AuthService {
  constructor(
    private usersService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<IUserAuth> {
    const user = await this.usersService.findUserByEmail(email);
    const correctPassword = user && (await user.comparePassword(password));

    if (!correctPassword) {
      new UnauthorizedException(`Password is not matched`);
    }
    return { id: user.id, email: user.email } as IUserAuth;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    return {
      token: this.jwtService.sign(payload),
    };
  }
}

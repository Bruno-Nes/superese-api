import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from 'src/user/user.service';

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

  async validateUser(email: string, password: string) {
    const user = await this.usersService.findUserByEmail(email);
    const correctPassword = user && (await user.comparePassword(password));

    if (correctPassword) {
      return { id: user.userId, email: user.email };
    }

    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email };

    return {
      token: this.jwtService.sign(payload),
    };
  }
}

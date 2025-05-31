import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserAuth } from './interfaces/user.interface';
import { UserService } from '@modules/user/services/user.service';
import { LoginUserDTO } from './dtos/login-user.dto';
import { FirebaseService } from '@modules/firebase/firebase.service';

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
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<IUserAuth> {
    const user = await this.usersService.findUserByEmail(email);

    return { id: user.id, email: user.email } as IUserAuth;
  }

  async login({ email, password }: LoginUserDTO) {
    const { idToken, refreshToken, expiresIn } =
      await this.firebaseService.signInWithEmailAndPassword(email, password);
    return { idToken, refreshToken, expiresIn };
  }

  async logout(token: string) {
    const { uid } = await this.firebaseService.verifyIdToken(token);
    return await this.firebaseService.revokeRefreshToken(uid);
  }

  async refreshAuthToken(refreshToken: string) {
    return await this.firebaseService.refreshAuthToken(refreshToken);
  }
}

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
    try {
      const { idToken, refreshToken, expiresIn } =
        await this.firebaseService.signInWithEmailAndPassword(email, password);
      
      // Verifica o token para obter dados do usuário
      const decodedToken = await this.firebaseService.verifyIdToken(idToken);
      
      // Verifica se o usuário existe no banco local, se não existir, cria
      let user = await this.usersService.findUserByFirebaseUid(decodedToken.uid);
      if (!user) {
        user = await this.usersService.createUserFromFirebase(
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || decodedToken.email.split('@')[0]
        );
      }
      
      return { idToken, refreshToken, expiresIn, user };
    } catch (error) {
      console.error('Erro no login:', error);
      throw error; // Propaga o erro original do Firebase ou do banco
    }
  }

  async logout(token: string) {
    const { uid } = await this.firebaseService.verifyIdToken(token);
    return await this.firebaseService.revokeRefreshToken(uid);
  }

  async refreshAuthToken(refreshToken: string) {
    return await this.firebaseService.refreshAuthToken(refreshToken);
  }
}

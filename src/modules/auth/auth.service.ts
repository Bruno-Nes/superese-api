import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { IUserAuth } from './interfaces/user.interface';
import { UserService } from '@modules/user/services/user.service';
import { LoginUserDTO } from './dtos/login-user.dto';
import { GoogleLoginDTO } from './dtos/google-login.dto';
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
  private logger: Logger;
  constructor(
    private usersService: UserService,
    private firebaseService: FirebaseService,
    private jwtService: JwtService,
  ) {
    this.logger = new Logger(AuthService.name);
  }

  async validateUser(email: string): Promise<IUserAuth> {
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
      let user = await this.usersService.findUserByFirebaseUid(
        decodedToken.uid,
      );
      if (!user) {
        user = await this.usersService.createUserFromFirebase(
          decodedToken.uid,
          decodedToken.email,
          decodedToken.name || decodedToken.email.split('@')[0],
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

  async googleLogin(googleLoginData: GoogleLoginDTO) {
    try {
      // Autentica com Firebase usando o token do Google
      const firebaseResponse =
        await this.firebaseService.signInWithGoogleIdToken(
          googleLoginData.idToken,
        );

      this.logger.log(
        `Firebase response: ${firebaseResponse.idToken}, ${firebaseResponse.refreshToken}, ${firebaseResponse.expiresIn}`,
      );

      // Verifica o token Firebase para obter dados do usuário
      const decodedToken = await this.firebaseService.verifyIdToken(
        firebaseResponse.idToken,
      );

      // Verifica se os dados coincidem
      if (
        decodedToken.firebase?.identities?.['google.com']?.[0] !==
          googleLoginData.googleUid ||
        decodedToken.email !== googleLoginData.email
      ) {
        throw new Error('Token data mismatch');
      }

      this.logger.log(
        `Decoded token: ${JSON.stringify(decodedToken, null, 2)}`,
      );

      // Verifica se o usuário existe no banco local pelo firebaseUid
      let user = await this.usersService.findUserByFirebaseUid(
        decodedToken.uid,
      );

      if (!user) {
        // Se não existir, cria o usuário no banco local
        user = await this.usersService.createUserFromGoogle(
          decodedToken.uid, // Firebase UID
          googleLoginData.googleUid, // Google UID
          decodedToken.email,
          decodedToken.name ||
            googleLoginData.displayName ||
            decodedToken.email.split('@')[0],
          googleLoginData.photoURL,
        );
      }

      // Retorna os tokens do Firebase e dados do usuário
      return {
        idToken: firebaseResponse.idToken,
        refreshToken: firebaseResponse.refreshToken,
        expiresIn: firebaseResponse.expiresIn,
        user,
        provider: 'google',
      };
    } catch (error) {
      console.error('Erro no login do Google:', error);
      throw error;
    }
  }
}

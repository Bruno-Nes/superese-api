import axios from 'axios';
import * as firebaseAdmin from 'firebase-admin';
import { CreateRequest } from 'firebase-admin/lib/auth/auth-config';
import { DecodedIdToken } from 'firebase-admin/lib/auth/token-verifier';
import { BadRequestException, Injectable } from '@nestjs/common';
import { FirebaseConfigService } from './firebase-config.service';
import * as path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { UserRecord } from 'firebase-admin/lib/auth/user-record';

@Injectable()
export class FirebaseService {
  private readonly apiKey: string;

  constructor(firebaseConfig: FirebaseConfigService) {
    this.apiKey = firebaseConfig.apiKey;
  }

  async createUser(props: CreateRequest): Promise<UserRecord> {
    return (await firebaseAdmin
      .auth()
      .createUser(props)
      .catch(this.handleFirebaseAuthError)) as any;
  }

  async setCustomUserClaims(uid: string, claims: Record<string, any>) {
    return await firebaseAdmin.auth().setCustomUserClaims(uid, claims);
  }

  async verifyIdToken(
    token: string,
    checkRevoked = false,
  ): Promise<DecodedIdToken> {
    return (await firebaseAdmin
      .auth()
      .verifyIdToken(token, checkRevoked)
      .catch(this.handleFirebaseAuthError)) as DecodedIdToken;
  }

  async signInWithEmailAndPassword(email: string, password: string) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${this.apiKey}`;
    return await this.sendPostRequest(url, {
      email,
      password,
      returnSecureToken: true,
    }).catch(this.handleRestApiError);
  }

  async revokeRefreshToken(uid: string) {
    return await firebaseAdmin
      .auth()
      .revokeRefreshTokens(uid)
      .catch(this.handleFirebaseAuthError);
  }

  async refreshAuthToken(refreshToken: string) {
    const {
      id_token: idToken,
      refresh_token: newRefreshToken,
      expires_in: expiresIn,
    } = await this.sendRefreshAuthTokenRequest(refreshToken).catch(
      this.handleRestApiError,
    );
    return {
      idToken,
      refreshToken: newRefreshToken,
      expiresIn,
    };
  }

  async signInWithGoogleIdToken(idToken: string) {
    const url = `https://identitytoolkit.googleapis.com/v1/accounts:signInWithIdp?key=${this.apiKey}`;
    return await this.sendPostRequest(url, {
      postBody: `id_token=${idToken}&providerId=google.com`,
      requestUri: 'http://localhost',
      returnIdpCredential: true,
      returnSecureToken: true,
    }).catch(this.handleRestApiError);
  }

  async getUserByGoogleUid(googleUid: string): Promise<UserRecord | null> {
    try {
      return await firebaseAdmin.auth().getUser(googleUid);
    } catch (error) {
      if (error.code === 'auth/user-not-found') {
        return null;
      }
      throw this.handleFirebaseAuthError(error);
    }
  }

  async createUserFromGoogleData(googleData: {
    uid: string;
    email: string;
    displayName?: string;
    photoURL?: string;
  }): Promise<UserRecord> {
    const createRequest: CreateRequest = {
      uid: googleData.uid,
      email: googleData.email,
      emailVerified: true,
      displayName: googleData.displayName,
      photoURL: googleData.photoURL,
    };

    return await this.createUser(createRequest);
  }

  private async sendRefreshAuthTokenRequest(refreshToken: string) {
    const url = `https://securetoken.googleapis.com/v1/token?key=${this.apiKey}`;
    const payload = {
      grant_type: 'refresh_token',
      refresh_token: refreshToken,
    };
    return await this.sendPostRequest(url, payload);
  }

  private async sendPostRequest(url: string, data: any) {
    const response = await axios.post(url, data, {
      headers: { 'Content-Type': 'application/json' },
    });
    return response.data;
  }

  private handleFirebaseAuthError(error: any) {
    if (error.code?.startsWith('auth/')) {
      throw new BadRequestException(error.message);
    }
    throw new Error(error.message);
  }

  private handleRestApiError(error: any) {
    if (error.response?.data?.error?.code === 400) {
      const messageKey = error.response?.data?.error?.message;
      const message =
        {
          INVALID_LOGIN_CREDENTIALS: 'Invalid login credentials',
          INVALID_REFRESH_TOKEN: 'Invalid refresh token',
          TOKEN_EXPIRED: 'Token expired',
          USER_DISABLED: 'User disabled',
        }[messageKey] ?? messageKey;
      throw new BadRequestException(message);
    }
    throw new Error(error.message);
  }

  async uploadImage(file: Express.Multer.File, folder = 'images') {
    const bucket = firebaseAdmin.storage().bucket();
    const fileName = `${folder}/${uuidv4()}${path.extname(file.originalname)}`;
    const fileUpload = bucket.file(fileName);

    await fileUpload.save(file.buffer, {
      metadata: {
        contentType: file.mimetype,
        metadata: {
          firebaseStorageDownloadTokens: uuidv4(), // token para acesso público
        },
      },
    });

    const publicUrl = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURIComponent(
      fileName,
    )}?alt=media`;

    return publicUrl;
  }
}

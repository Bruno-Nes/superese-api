import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class GoogleLoginDTO {
  @ApiProperty({
    example: 'google-uid-123456789',
    description: 'UID único do usuário no Google',
  })
  @IsNotEmpty()
  @IsString()
  googleUid: string;

  @ApiProperty({
    example: 'user@gmail.com',
    description: 'E-mail do usuário do Google',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @ApiProperty({
    example: 'João Silva',
    description: 'Nome completo do usuário (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  displayName?: string;

  @ApiProperty({
    example: 'https://lh3.googleusercontent.com/photo.jpg',
    description: 'URL da foto do perfil do usuário (opcional)',
    required: false,
  })
  @IsOptional()
  @IsString()
  photoURL?: string;

  @ApiProperty({
    example: 'google-id-token-jwt',
    description: 'Token de identificação do Google para verificação',
  })
  @IsNotEmpty()
  @IsString()
  idToken: string;
}

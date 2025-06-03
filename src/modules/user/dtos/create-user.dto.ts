import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MinLength,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDTO {
  @ApiProperty({ example: 'John', description: 'Primeiro nome do usuário' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Último nome do usuário' })
  lastName: string;

  @ApiProperty({
    example: 'StrongPass123',
    description: 'Senha do usuário',
    minLength: 4,
  })
  @IsNotEmpty()
  @IsString()
  @MinLength(4)
  password: string;

  @ApiProperty({
    example: 'john.doe@example.com',
    description: 'E-mail do usuário',
  })
  @IsNotEmpty()
  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  username?: string;

  @ApiProperty({
    example: '1990-05-20',
    description: 'Data de nascimento do usuário',
    type: String,
    format: 'date',
  })
  birthdayDate: Date;

  @ApiProperty({
    example: 'admin',
    description: 'Papel do usuário (opcional)',
    required: false,
  })
  role?: string;

  @ApiProperty({
    example: 'Desenvolvedor full-stack',
    description: 'Sobre o usuário (opcional)',
    required: false,
  })
  about?: string;

  @ApiProperty({
    example: 'https://example.com/avatar.jpg',
    description: 'Avatar do usuário (opcional)',
    required: false,
  })
  avatar?: string;

  @ApiProperty({
    example: '+5511999999999',
    description: 'Número de telefone do usuário (opcional)',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    example: 'male',
    description: 'Gênero do usuário (opcional)',
    required: false,
  })
  gender?: string;
}

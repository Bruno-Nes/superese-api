import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class LoginDTO {
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
}

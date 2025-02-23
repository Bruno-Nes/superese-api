import { IsEmail, IsString, MinLength } from 'class-validator';

export class CreateUserDTO {
  firstName: string;
  lastName: string;
  @IsString()
  @MinLength(4)
  password: string;
  @IsEmail()
  email?: string;
  role?: string;
  about?: string;
  avatar?: string;
  phoneNumber?: string;
  gender?: string;
}

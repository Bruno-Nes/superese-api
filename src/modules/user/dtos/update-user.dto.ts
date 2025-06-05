import {
  IsOptional,
  IsString,
  IsEmail,
  IsDateString,
  IsBoolean,
} from 'class-validator';

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string;

  @IsOptional()
  @IsString()
  lastName?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsDateString()
  birthdayDate?: string;

  @IsOptional()
  @IsString()
  username?: string;

  @IsOptional()
  @IsString()
  about?: string;

  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @IsOptional()
  @IsBoolean({
    message: 'isPrivate must be a boolean value',
  })
  isPrivate?: boolean;
}

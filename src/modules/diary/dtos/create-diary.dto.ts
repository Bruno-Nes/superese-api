import { IsNotEmpty, IsString, IsOptional } from 'class-validator';

export class CreateDiaryDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  content?: string;
}

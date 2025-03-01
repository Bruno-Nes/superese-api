import { IsOptional, IsString } from 'class-validator';

export class UpdateDiaryDto {
  @IsOptional()
  @IsString()
  title?: string;

  @IsOptional()
  @IsString()
  content?: string;
}

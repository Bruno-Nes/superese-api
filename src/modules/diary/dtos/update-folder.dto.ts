import { IsOptional, IsString } from 'class-validator';

export class UpdateFolderDto {
  @IsOptional()
  @IsString()
  name?: string;
}

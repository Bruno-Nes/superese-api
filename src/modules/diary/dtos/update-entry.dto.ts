import { IsOptional, IsString, IsUrl } from 'class-validator';

export class UpdateEntryDto {
  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsUrl({}, { each: true })
  links?: string[];
}

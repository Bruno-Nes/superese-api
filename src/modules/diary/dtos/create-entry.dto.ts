import { IsNotEmpty, IsString, IsOptional, IsUrl } from 'class-validator';

export class CreateEntryDto {
  @IsNotEmpty()
  @IsString()
  text: string;

  @IsOptional()
  @IsUrl({}, { each: true })
  links?: string[];
}

import { IsOptional, IsString } from 'class-validator';

export class IncreaseProgressDTO {
  @IsOptional()
  @IsString()
  observation?: string;
}

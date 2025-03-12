import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateFolderDto {
  @ApiProperty({
    description: 'Nome da pasta',
    example: 'Pastas Renomeadas',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O nome deve ser uma string' })
  name?: string;
}

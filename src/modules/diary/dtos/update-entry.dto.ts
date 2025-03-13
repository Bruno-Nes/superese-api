import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateEntryDto {
  @ApiProperty({
    description: 'Texto da entrada',
    example: 'Atualizei meu diário hoje',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O texto deve ser uma string' })
  text?: string;
}

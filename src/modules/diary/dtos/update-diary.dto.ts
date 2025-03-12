import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString } from 'class-validator';

export class UpdateDiaryDto {
  @ApiProperty({
    description: 'Título do diário',
    example: 'Meu Diário Atualizado',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O título deve ser uma string' })
  title?: string;

  @ApiProperty({
    description: 'Conteúdo do diário',
    example: 'Novas anotações...',
    required: false,
  })
  @IsOptional()
  @IsString({ message: 'O conteúdo deve ser uma string' })
  content?: string;
}

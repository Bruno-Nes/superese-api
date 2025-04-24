import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateDiaryDto {
  @ApiProperty({ description: 'Título do diário', example: 'Meu Diário' })
  @IsNotEmpty({ message: 'O título é obrigatório' })
  @IsString({ message: 'O título deve ser uma string' })
  title: string;

  @ApiProperty({
    description: 'Conteúdo opcional do diário',
    example: 'Anotações do dia...',
    required: true,
  })
  @IsOptional()
  @IsString({ message: 'O conteúdo deve ser uma string' })
  content: string;
}

import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class UpdatePostDTO {
  @ApiProperty({
    description: 'Novo título do post',
    example: 'Título atualizado',
    required: false,
  })
  @IsString()
  title?: string;

  @ApiProperty({
    description: 'Novo conteúdo do post',
    example: 'Conteúdo atualizado do post.',
    required: false,
  })
  @IsString()
  content?: string;
}

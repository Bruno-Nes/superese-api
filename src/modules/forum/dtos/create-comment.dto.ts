import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CommentPostDTO {
  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Isso é um comentário',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

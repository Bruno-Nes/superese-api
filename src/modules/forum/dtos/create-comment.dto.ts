import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CommentPostDTO {
  @ApiProperty({
    description: 'Conteúdo do comentário',
    example: 'Isso é um comentário',
  })
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsOptional()
  @IsString()
  parentCommentId?: string;
}

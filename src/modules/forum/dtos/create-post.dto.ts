import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDTO {
  @ApiProperty({ description: 'Título do post', example: 'Meu primeiro post' })
  @IsNotEmpty()
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Conteúdo do post',
    example: 'Esse é o conteúdo do meu post.',
  })
  @IsNotEmpty()
  @IsString()
  content: string;
}

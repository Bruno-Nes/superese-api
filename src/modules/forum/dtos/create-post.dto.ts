import { IsNotEmpty, IsString } from 'class-validator';

export class CreatePostDTO {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  content: string;
}

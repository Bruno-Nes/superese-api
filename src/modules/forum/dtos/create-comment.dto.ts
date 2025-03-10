import { IsNotEmpty, IsString } from 'class-validator';

export class CommentPostDTO {
  @IsNotEmpty()
  @IsString()
  content: string;

  @IsNotEmpty()
  @IsString()
  postId: string;

  @IsNotEmpty()
  @IsString()
  userId: string;
}

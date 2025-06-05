import { IsString, IsNotEmpty } from 'class-validator';

export class CreateOrGetChatDto {
  @IsString()
  @IsNotEmpty()
  user1Id: string;

  @IsString()
  @IsNotEmpty()
  user2Id: string;
}

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  content: string;
}

export class MarkAsReadDto {
  @IsString()
  @IsNotEmpty()
  userId: string;
}

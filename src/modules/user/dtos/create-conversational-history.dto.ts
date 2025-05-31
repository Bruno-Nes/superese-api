import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MoodType } from '../entities/conversation-history.entity';

export class CreateConversationDto {
  @IsEnum(['ansiedade', 'impulsividade', 'culpa', 'vergonha', 'desesperança'])
  mood: MoodType;

  @IsString()
  @IsNotEmpty()
  userInput: string;

  @IsString()
  @IsNotEmpty()
  gptResponse: string;
}

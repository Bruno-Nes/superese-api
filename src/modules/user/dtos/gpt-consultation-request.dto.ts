import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { MoodType } from '../entities/conversation-history.entity';

export class GPTConsultationRequestDto {
  @IsEnum(['ansiedade', 'impulsividade', 'culpa', 'vergonha', 'desesperança'])
  mood: MoodType;

  @IsString()
  @IsNotEmpty()
  userMessage: string;
}

import { MoodType } from '../entities/conversation-history.entity';

export interface ConversationHistoryResponseDto {
  id: string;
  mood: MoodType;
  userInput: string;
  gptResponse: string;
  createdAt: Date;
}

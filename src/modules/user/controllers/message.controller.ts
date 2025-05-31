import {
  Controller,
  Get,
  Param,
  Query,
  UseGuards,
  Delete,
} from '@nestjs/common';
import { MessageService } from '../services/message.service';
import { JwtAuthGuard } from '../../auth/guards/jwt-auth.guard';

@Controller('messages')
@UseGuards(JwtAuthGuard)
export class MessageController {
  constructor(private readonly messageService: MessageService) {}

  @Get('conversations/:userId')
  async getConversations(@Param('userId') userId: string) {
    return this.messageService.getConversations(userId);
  }

  @Get('between')
  async getMessagesBetweenUsers(
    @Query('user1') user1Id: string,
    @Query('user2') user2Id: string,
  ) {
    return this.messageService.getMessagesBetweenUsers(user1Id, user2Id);
  }

  @Delete(':messageId/:userId')
  async deleteMessage(
    @Param('messageId') messageId: number,
    @Param('userId') userId: string,
  ) {
    return this.messageService.deleteMessage(messageId, userId);
  }
}

import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  UseGuards,
  Body,
  Request,
} from '@nestjs/common';
import { ChatService } from '../services/chat.service';
import {
  CreateOrGetChatDto,
  SendMessageDto,
  MarkAsReadDto,
} from '../dtos/chat.dto';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post('create-or-get')
  @UseGuards(AuthGuard)
  async getOrCreateChat(
    @Body() createOrGetChatDto: CreateOrGetChatDto,
    @Request() req: any,
  ) {
    const { user1Id, user2Id } = createOrGetChatDto;
    const currentUserId = req.user?.uid;
    return this.chatService.getOrCreateChat(user1Id, user2Id, currentUserId);
  }

  @Post(':chatId/send')
  @UseGuards(AuthGuard)
  async sendMessage(
    @Param('chatId') chatId: string,
    @Body() sendMessageDto: SendMessageDto,
    @Request() req: any,
  ) {
    const { content } = sendMessageDto;
    const senderId = req.user?.uid;
    return this.chatService.sendMessage(chatId, senderId, content);
  }

  @Get(':chatId/messages')
  @UseGuards(AuthGuard)
  async getNewMessages(
    @Param('chatId') chatId: string,
    @Query('lastMessageId') lastMessageId?: string,
  ) {
    const lastId = lastMessageId ? parseInt(lastMessageId) : undefined;
    return this.chatService.getNewMessages(chatId, lastId);
  }

  @Get('user/:userId')
  @Public()
  async getUserChats(@Param('userId') userId: string) {
    return this.chatService.getUserChats(userId);
  }

  @Get('chats')
  @UseGuards(AuthGuard)
  async getCurrentUserChats(@Request() req: any) {
    const currentUserId = req.user?.id;
    return this.chatService.getUserChats(currentUserId);
  }

  @Post(':chatId/mark-read')
  @UseGuards(AuthGuard)
  async markAsRead(
    @Param('chatId') chatId: string,
    @Body() markAsReadDto: MarkAsReadDto,
  ) {
    const { userId } = markAsReadDto;
    const markedCount = await this.chatService.markMessagesAsRead(
      chatId,
      userId,
    );
    return { message: 'Mensagens marcadas como lidas', markedCount };
  }

  @Get(':chatId')
  @UseGuards(AuthGuard)
  async getChatById(@Param('chatId') chatId: string, @Request() req: any) {
    const currentUserId = req.user?.uid;
    return this.chatService.getChatById(chatId, currentUserId);
  }
}

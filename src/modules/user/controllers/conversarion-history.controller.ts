import {
  Controller,
  Post,
  Body,
  Get,
  Request,
  HttpCode,
  HttpStatus,
  Delete,
} from '@nestjs/common';
import { ConversationService } from '../services/conversation-history.service';
import { CreateConversationDto } from '../dtos/create-conversational-history.dto';
import { ConversationHistory } from '../entities/conversation-history.entity';
import { ConversationHistoryResponseDto } from '../dtos/conversational-history-response.dto';

@Controller('conversations')
export class ConversationController {
  constructor(private readonly conversationService: ConversationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Body() dto: CreateConversationDto,
    @Request() request: any,
  ): Promise<{ message: string; data: ConversationHistory }> {
    const firebaseUid = request.user.uid;
    const conversation = await this.conversationService.create(
      dto,
      firebaseUid,
    );
    return {
      message: 'Conversa salva com sucesso.',
      data: conversation,
    };
  }

  @Get()
  async findAllByProfile(
    @Request() request: any,
  ): Promise<ConversationHistoryResponseDto[]> {
    const firebaseUid = request.user.uid;
    return this.conversationService.findAllByProfile(firebaseUid);
  }

  @Delete()
  async deleteAllByProfile(
    @Request() request: any,
  ): Promise<{ message: string }> {
    const firebaseUid = request.user.uid;
    await this.conversationService.deleteAllByProfile(firebaseUid);
    return { message: 'Histórico de conversas deletado com sucesso.' };
  }
}

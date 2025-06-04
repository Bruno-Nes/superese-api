import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  Request,
  UseGuards,
  HttpCode,
  HttpStatus,
  Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { GetNotificationsDto } from '../dtos/get-notifications.dto';
import { MarkAsReadDto } from '../dtos/update-notification.dto';
import {
  NotificationListResponseDto,
  NotificationStatsDto,
} from '../dtos/notification-response.dto';

@ApiTags('Notifications')
@Controller('notifications')
@UseGuards(AuthGuard)
export class NotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Get()
  @ApiOperation({ summary: 'Busca notificações do usuário logado' })
  @ApiResponse({
    status: 200,
    description: 'Lista de notificações retornada com sucesso',
    type: NotificationListResponseDto,
  })
  @ApiQuery({
    name: 'limit',
    description: 'Número máximo de notificações por página',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Número de notificações para pular',
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'unreadOnly',
    description: 'Buscar apenas notificações não lidas',
    required: false,
    example: false,
  })
  async getNotifications(
    @Request() request: any,
    @Query() query: GetNotificationsDto,
  ): Promise<NotificationListResponseDto> {
    const firebaseUserId = request.user.uid;
    return this.notificationService.getNotifications(firebaseUserId, query);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Busca estatísticas das notificações do usuário' })
  @ApiResponse({
    status: 200,
    description: 'Estatísticas retornadas com sucesso',
    type: NotificationStatsDto,
  })
  async getNotificationStats(
    @Request() request: any,
  ): Promise<NotificationStatsDto> {
    const firebaseUserId = request.user.uid;
    return this.notificationService.getNotificationStats(firebaseUserId);
  }

  @Patch('mark-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca notificações como lidas' })
  @ApiResponse({
    status: 200,
    description: 'Notificações marcadas como lidas com sucesso',
    schema: {
      properties: {
        updated: { type: 'number', example: 3 },
      },
    },
  })
  @ApiBody({ type: MarkAsReadDto, required: false })
  async markAsRead(
    @Request() request: any,
    @Body() body?: MarkAsReadDto,
  ): Promise<{ updated: number }> {
    const firebaseUserId = request.user.uid;
    return this.notificationService.markAsRead(
      firebaseUserId,
      body?.notificationIds,
    );
  }

  @Patch('mark-all-as-read')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Marca todas as notificações como lidas' })
  @ApiResponse({
    status: 200,
    description: 'Todas as notificações marcadas como lidas com sucesso',
    schema: {
      properties: {
        updated: { type: 'number', example: 10 },
      },
    },
  })
  async markAllAsRead(@Request() request: any): Promise<{ updated: number }> {
    const firebaseUserId = request.user.uid;
    return this.notificationService.markAllAsRead(firebaseUserId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Deleta uma notificação específica' })
  @ApiResponse({
    status: 204,
    description: 'Notificação deletada com sucesso',
  })
  @ApiResponse({
    status: 404,
    description: 'Notificação não encontrada',
  })
  @ApiParam({
    name: 'id',
    description: 'ID da notificação',
    example: 'uuid-string',
  })
  async deleteNotification(
    @Request() request: any,
    @Param('id') notificationId: string,
  ): Promise<void> {
    const firebaseUserId = request.user.uid;
    return this.notificationService.deleteNotification(
      firebaseUserId,
      notificationId,
    );
  }
}

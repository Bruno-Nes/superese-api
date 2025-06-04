import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  Request,
} from '@nestjs/common';
import { NotificationService } from '../services/notification.service';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { NotificationType } from '../entities/notification.entity';

@Controller('test-notifications')
export class TestNotificationController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post('create-test')
  @UseGuards(AuthGuard)
  async createTestNotification(
    @Body() body: { recipientId: string; message: string },
    @Request() request: any,
  ) {
    const actorProfile = request.user; // Assuming user profile is attached by AuthGuard

    return await this.notificationService.createNotification({
      type: NotificationType.LIKE,
      recipientId: body.recipientId,
      actorId: actorProfile.uid, // Using Firebase UID as actor ID
      message: body.message || 'Test notification',
    });
  }

  @Get('stats')
  @UseGuards(AuthGuard)
  async getStats(@Request() request: any) {
    const firebaseUid = request.user.uid;
    return await this.notificationService.getNotificationStats(firebaseUid);
  }
}

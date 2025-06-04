import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { NotificationStatus } from '../entities/notification.entity';

export class UpdateNotificationDto {
  @IsOptional()
  @IsEnum(NotificationStatus)
  status?: NotificationStatus;
}

export class MarkAsReadDto {
  @IsOptional()
  @IsUUID('4', { each: true })
  notificationIds?: string[];
}

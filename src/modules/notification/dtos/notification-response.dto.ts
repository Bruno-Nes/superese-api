import {
  NotificationType,
  NotificationStatus,
} from '../entities/notification.entity';

export class NotificationResponseDto {
  id: string;
  type: NotificationType;
  status: NotificationStatus;
  message: string;
  createdAt: Date;

  actor: {
    id: string;
    username: string;
    firstName?: string;
    lastName?: string;
    avatar?: string;
  };

  // Informações para redirecionamento
  redirectData?: {
    type: 'post' | 'comment' | 'friendship' | 'profile';
    id: string;
    additionalData?: any;
  };
}

export class NotificationStatsDto {
  totalUnread: number;
  totalNotifications: number;
}

export class NotificationListResponseDto {
  notifications: NotificationResponseDto[];
  stats: NotificationStatsDto;
  hasMore: boolean;
}

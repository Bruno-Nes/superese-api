import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Notification,
  NotificationType,
  NotificationStatus,
} from '../entities/notification.entity';
import { Profile } from '@modules/user/entities/profile.entity';
import { Post } from '@modules/forum/entities/post.entity';
import { Comment } from '@modules/forum/entities/comment.entity';
import { Friendship } from '@modules/user/entities/friendship.entity';
import { GetNotificationsDto } from '../dtos/get-notifications.dto';
import {
  NotificationListResponseDto,
  NotificationResponseDto,
  NotificationStatsDto,
} from '../dtos/notification-response.dto';
import { UserService } from '@modules/user/services/user.service';

@Injectable()
export class NotificationService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly userService: UserService,
  ) {}

  // Método genérico para criar notificações
  async createNotification(data: {
    type: NotificationType;
    recipientId: string;
    actorId: string;
    message: string;
    postId?: string;
    commentId?: string;
    friendshipId?: string;
    metadata?: any;
  }): Promise<Notification> {
    const recipient = await this.userService.findByIdOrThrow(data.recipientId);
    const actor = await this.userService.findByIdOrThrow(data.actorId);

    const notification = this.notificationRepository.create({
      type: data.type,
      message: data.message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: actor.id } as Profile,
      post: data.postId ? ({ id: data.postId } as Post) : undefined,
      comment: data.commentId ? ({ id: data.commentId } as Comment) : undefined,
      friendship: data.friendshipId
        ? ({ id: data.friendshipId } as Friendship)
        : undefined,
      metadata: data.metadata || {
        actorUsername: actor.username,
        ...data.metadata,
      },
    });

    return await this.notificationRepository.save(notification);
  }

  // Método para criar notificação de like em post
  async createLikeNotification(
    postOwnerId: string,
    actorId: string,
    postId: string,
  ): Promise<void> {
    // Não criar notificação se o usuário curtiu seu próprio post
    if (postOwnerId === actorId) {
      return;
    }

    const recipient = await this.userService.findByIdOrThrow(postOwnerId);
    const actor = await this.userService.findByIdOrThrow(actorId);

    const message = `${actor.username} curtiu seu post`;

    const notification = this.notificationRepository.create({
      type: NotificationType.LIKE,
      message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: actor.id } as Profile,
      post: { id: postId } as Post,
      metadata: {
        postId,
        actorUsername: actor.username,
      },
    });

    await this.notificationRepository.save(notification);
  }

  // Método para criar notificação de comentário em post
  async createCommentNotification(
    postOwnerId: string,
    actorId: string,
    postId: string,
    commentId: string,
  ): Promise<void> {
    // Não criar notificação se o usuário comentou em seu próprio post
    if (postOwnerId === actorId) {
      return;
    }

    const recipient = await this.userService.findByIdOrThrow(postOwnerId);
    const actor = await this.userService.findByIdOrThrow(actorId);

    const message = `${actor.username} comentou no seu post`;

    const notification = this.notificationRepository.create({
      type: NotificationType.COMMENT,
      message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: actor.id } as Profile,
      post: { id: postId } as Post,
      comment: { id: commentId } as Comment,
      metadata: {
        postId,
        commentId,
        actorUsername: actor.username,
      },
    });

    await this.notificationRepository.save(notification);
  }

  // Método para criar notificação de resposta a comentário
  async createReplyNotification(
    originalCommentOwnerId: string,
    actorId: string,
    postId: string,
    parentCommentId: string,
    replyId: string,
  ): Promise<void> {
    // Não criar notificação se o usuário respondeu seu próprio comentário
    if (originalCommentOwnerId === actorId) {
      return;
    }

    const recipient = await this.userService.findByIdOrThrow(
      originalCommentOwnerId,
    );
    const actor = await this.userService.findByIdOrThrow(actorId);

    const message = `${actor.username} respondeu ao seu comentário`;

    const notification = this.notificationRepository.create({
      type: NotificationType.REPLY,
      message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: actor.id } as Profile,
      post: { id: postId } as Post,
      comment: { id: replyId } as Comment,
      metadata: {
        postId,
        parentCommentId,
        replyId,
        actorUsername: actor.username,
      },
    });

    await this.notificationRepository.save(notification);
  }

  // Método para criar notificação de pedido de amizade
  async createFriendRequestNotification(
    recipientId: string,
    requesterId: string,
    friendshipId: string,
  ): Promise<void> {
    const recipient = await this.userService.findByIdOrThrow(recipientId);
    const requester = await this.userService.findByIdOrThrow(requesterId);

    const message = `${requester.username} enviou uma solicitação de amizade`;

    const notification = this.notificationRepository.create({
      type: NotificationType.FRIEND_REQUEST,
      message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: requester.id } as Profile,
      friendship: { id: friendshipId } as Friendship,
      metadata: {
        friendshipId,
        requesterUsername: requester.username,
      },
    });

    await this.notificationRepository.save(notification);
  }

  // Método para criar notificação de amizade aceita
  async createFriendAcceptedNotification(
    requesterId: string,
    accepterId: string,
    friendshipId: string,
  ): Promise<void> {
    const recipient = await this.userService.findByIdOrThrow(requesterId);
    const accepter = await this.userService.findByIdOrThrow(accepterId);

    const message = `${accepter.username} aceitou sua solicitação de amizade`;

    const notification = this.notificationRepository.create({
      type: NotificationType.FRIEND_ACCEPTED,
      message,
      recipient: { id: recipient.id } as Profile,
      actor: { id: accepter.id } as Profile,
      friendship: { id: friendshipId } as Friendship,
      metadata: {
        friendshipId,
        accepterUsername: accepter.username,
      },
    });

    await this.notificationRepository.save(notification);
  }

  // Buscar notificações do usuário
  async getNotifications(
    firebaseUid: string,
    query: GetNotificationsDto,
  ): Promise<NotificationListResponseDto> {
    const user = await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { limit = 20, offset = 0, unreadOnly = false } = query;

    const queryBuilder = this.notificationRepository
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.actor', 'actor')
      .leftJoinAndSelect('notification.post', 'post')
      .leftJoinAndSelect('notification.comment', 'comment')
      .leftJoinAndSelect('notification.friendship', 'friendship')
      .where('notification.recipient.id = :userId', { userId: user.id })
      .orderBy('notification.createdAt', 'DESC')
      .skip(offset)
      .take(limit);

    if (unreadOnly) {
      queryBuilder.andWhere('notification.status = :status', {
        status: NotificationStatus.UNREAD,
      });
    }

    const [notifications, total] = await queryBuilder.getManyAndCount();

    // Buscar estatísticas
    const unreadCount = await this.notificationRepository.count({
      where: {
        recipient: { id: user.id },
        status: NotificationStatus.UNREAD,
      },
    });

    const mappedNotifications: NotificationResponseDto[] = notifications.map(
      (notification) => this.mapToResponseDto(notification),
    );

    return {
      notifications: mappedNotifications,
      stats: {
        totalUnread: unreadCount,
        totalNotifications: total,
      },
      hasMore: offset + limit < total,
    };
  }

  // Marcar notificações como lidas
  async markAsRead(
    firebaseUid: string,
    notificationIds?: string[],
  ): Promise<{ updated: number }> {
    const user = await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const queryBuilder = this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ status: NotificationStatus.READ })
      .where('recipient.id = :userId', { userId: user.id })
      .andWhere('status = :status', { status: NotificationStatus.UNREAD });

    if (notificationIds && notificationIds.length > 0) {
      queryBuilder.andWhere('id IN (:...ids)', { ids: notificationIds });
    }

    const result = await queryBuilder.execute();
    return { updated: result.affected || 0 };
  }

  // Marcar todas as notificações como lidas
  async markAllAsRead(firebaseUid: string): Promise<{ updated: number }> {
    return this.markAsRead(firebaseUid);
  }

  // Deletar notificação
  async deleteNotification(
    firebaseUid: string,
    notificationId: string,
  ): Promise<void> {
    const user = await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const notification = await this.notificationRepository.findOne({
      where: {
        id: notificationId,
        recipient: { id: user.id },
      },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    await this.notificationRepository.remove(notification);
  }

  // Buscar estatísticas das notificações
  async getNotificationStats(
    firebaseUid: string,
  ): Promise<NotificationStatsDto> {
    const user = await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const [totalUnread, totalNotifications] = await Promise.all([
      this.notificationRepository.count({
        where: {
          recipient: { id: user.id },
          status: NotificationStatus.UNREAD,
        },
      }),
      this.notificationRepository.count({
        where: {
          recipient: { id: user.id },
        },
      }),
    ]);

    return {
      totalUnread,
      totalNotifications,
    };
  }

  // Mapear entidade para DTO de resposta
  private mapToResponseDto(
    notification: Notification,
  ): NotificationResponseDto {
    const redirectData = this.getRedirectData(notification);

    return {
      id: notification.id,
      type: notification.type,
      status: notification.status,
      message: notification.message,
      createdAt: notification.createdAt,
      actor: {
        id: notification.actor.id,
        username: notification.actor.username,
        firstName: notification.actor.firstName,
        lastName: notification.actor.lastName,
        avatar: notification.actor.avatar,
      },
      redirectData,
    };
  }

  // Determinar dados de redirecionamento baseado no tipo de notificação
  private getRedirectData(notification: Notification): any {
    switch (notification.type) {
      case NotificationType.LIKE:
      case NotificationType.COMMENT:
        return {
          type: 'post',
          id: notification.post?.id,
          additionalData: {
            commentId: notification.comment?.id,
          },
        };

      case NotificationType.REPLY:
        return {
          type: 'post',
          id: notification.post?.id,
          additionalData: {
            commentId: notification.comment?.id,
            parentCommentId: notification.metadata?.parentCommentId,
          },
        };

      case NotificationType.FRIEND_REQUEST:
      case NotificationType.FRIEND_ACCEPTED:
        return {
          type: 'friendship',
          id: notification.friendship?.id,
          additionalData: {
            profileId: notification.actor.id,
          },
        };

      default:
        return null;
    }
  }
}

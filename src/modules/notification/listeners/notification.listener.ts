import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { NotificationService } from '../services/notification.service';
import { NotificationType } from '../entities/notification.entity';
import {
  PostLikedEvent,
  CommentCreatedEvent,
  ReplyCreatedEvent,
  FriendRequestSentEvent,
  FriendRequestAcceptedEvent,
  MessageSentEvent,
} from '../events/notification.events';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('post.liked')
  async handlePostLiked(event: PostLikedEvent) {
    // Não criar notificação se o usuário curtiu próprio post
    if (event.postAuthorId === event.actorId) {
      return;
    }

    await this.notificationService.createNotification({
      type: NotificationType.LIKE,
      recipientId: event.postAuthorId,
      actorId: event.actorId,
      postId: event.postId,
      message: `${event.actorName} curtiu seu post`,
    });
  }

  @OnEvent('comment.created')
  async handleCommentCreated(event: CommentCreatedEvent) {
    // Não criar notificação se o usuário comentou próprio post
    if (event.postAuthorId === event.actorId) {
      return;
    }

    await this.notificationService.createNotification({
      type: NotificationType.COMMENT,
      recipientId: event.postAuthorId,
      actorId: event.actorId,
      postId: event.postId,
      commentId: event.commentId,
      message: `${event.actorName} comentou em seu post`,
    });
  }

  @OnEvent('reply.created')
  async handleReplyCreated(event: ReplyCreatedEvent) {
    // Não criar notificação se o usuário respondeu próprio comentário
    if (event.parentCommentAuthorId === event.actorId) {
      return;
    }

    await this.notificationService.createNotification({
      type: NotificationType.REPLY,
      recipientId: event.parentCommentAuthorId,
      actorId: event.actorId,
      postId: event.postId,
      commentId: event.commentId,
      message: `${event.actorName} respondeu seu comentário`,
    });
  }

  @OnEvent('friend.request.sent')
  async handleFriendRequestSent(event: FriendRequestSentEvent) {
    await this.notificationService.createNotification({
      type: NotificationType.FRIEND_REQUEST,
      recipientId: event.recipientId,
      actorId: event.requesterId,
      friendshipId: event.friendshipId,
      message: `${event.requesterName} enviou uma solicitação de amizade`,
    });
  }

  @OnEvent('friend.request.accepted')
  async handleFriendRequestAccepted(event: FriendRequestAcceptedEvent) {
    await this.notificationService.createNotification({
      type: NotificationType.FRIEND_ACCEPTED,
      recipientId: event.requesterId,
      actorId: event.accepterId,
      friendshipId: event.friendshipId,
      message: `${event.accepterName} aceitou sua solicitação de amizade`,
    });
  }

  @OnEvent('message.sent')
  async handleMessageSent(event: MessageSentEvent) {
    console.log('📨 Evento message.sent recebido:', event);

    // Não criar notificação se o usuário enviou mensagem para si mesmo
    if (event.senderId === event.recipientId) {
      console.log(
        '⚠️ Não criando notificação: usuário enviou mensagem para si mesmo',
      );
      return;
    }

    console.log('📝 Criando notificação para:', event.recipientId);

    await this.notificationService.createNotification({
      type: NotificationType.MESSAGE,
      recipientId: event.recipientId,
      actorId: event.senderId,
      chatId: event.chatId,
      message: `${event.senderName} enviou uma mensagem`,
      metadata: {
        messageId: event.messageId,
        messagePreview:
          event.messageContent.length > 50
            ? event.messageContent.substring(0, 50) + '...'
            : event.messageContent,
      },
    });

    console.log('✅ Notificação criada com sucesso');
  }
}

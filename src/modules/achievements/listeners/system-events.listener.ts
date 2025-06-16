import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementsService } from '../services/achievements.service';
import { AchievementType } from '../entities/achievement.entity';
import {
  PostLikedEvent,
  CommentCreatedEvent,
  ReplyCreatedEvent,
  FriendRequestAcceptedEvent,
} from '@modules/notification/events/notification.events';
import {
  DiaryEntryCreatedEvent,
  PlanProgressEvent,
} from '../events/user-action.event';

@Injectable()
export class SystemEventsListener {
  private readonly logger = new Logger(SystemEventsListener.name);

  constructor(private achievementsService: AchievementsService) {}

  // Capturar eventos do sistema de likes
  @OnEvent('post.liked')
  async handlePostLiked(event: PostLikedEvent): Promise<void> {
    this.logger.debug(`Post liked by user ${event.actorId}`);

    // Incrementar progresso para interações no fórum
    await this.achievementsService.updateProgress(
      event.actorId,
      AchievementType.FORUM_INTERACTIONS,
      1,
    );

    // Verificar se o post atingiu marcos de curtidas (10, 50, 100)
    await this.checkPostPopularityMilestones(event.postId, event.postAuthorId);
  }

  // Capturar eventos de comentários
  @OnEvent('comment.created')
  async handleCommentCreated(event: CommentCreatedEvent): Promise<void> {
    this.logger.debug(`Comment created by user ${event.actorId}`);

    // Incrementar progresso para interações no fórum
    await this.achievementsService.updateProgress(
      event.actorId,
      AchievementType.FORUM_INTERACTIONS,
      1,
    );
  }

  // Capturar eventos de respostas
  @OnEvent('reply.created')
  async handleReplyCreated(event: ReplyCreatedEvent): Promise<void> {
    this.logger.debug(`Reply created by user ${event.actorId}`);

    // Incrementar progresso para interações no fórum
    await this.achievementsService.updateProgress(
      event.actorId,
      AchievementType.FORUM_INTERACTIONS,
      1,
    );
  }

  // Capturar eventos de amizade aceita
  @OnEvent('friend.request.accepted')
  async handleFriendshipAccepted(
    event: FriendRequestAcceptedEvent,
  ): Promise<void> {
    this.logger.debug(
      `Friendship accepted between ${event.accepterId} and ${event.requesterId}`,
    );

    // Ambos os usuários ganham progresso na conquista de conexões
    await this.achievementsService.updateProgress(
      event.accepterId,
      AchievementType.FRIEND_CONNECTIONS,
      1,
    );

    await this.achievementsService.updateProgress(
      event.requesterId,
      AchievementType.FRIEND_CONNECTIONS,
      1,
    );
  }

  // Capturar eventos de milestones de posts populares
  @OnEvent('post.likes.milestone')
  async handlePostLikesMilestone(event: any): Promise<void> {
    this.logger.debug(`Post ${event.postId} reached ${event.likesCount} likes`);

    // Dar progresso ao autor do post
    await this.achievementsService.updateProgress(
      event.authorId,
      AchievementType.POPULAR_POST,
      1,
    );
  }

  // Capturar eventos de progresso do planner
  @OnEvent('plan.progress.updated')
  async handlePlanProgressUpdated(event: PlanProgressEvent): Promise<void> {
    this.logger.debug(`Plan progress updated for user ${event.profileId}`);

    if (event.data.progressType === 'increase') {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.CONSECUTIVE_PRACTICES,
        1,
      );
    }
  }

  // Capturar eventos de conclusão de plano
  @OnEvent('plan.completed')
  async handlePlanCompleted(event: PlanProgressEvent): Promise<void> {
    this.logger.debug(`Plan completed by user ${event.profileId}`);

    if (event.data.progressType === 'completion') {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.PLAN_COMPLETION,
        1,
      );

      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.AI_PLAN_COMPLETION,
        1,
      );
    }
  }

  // Capturar eventos de criação de entrada do diário
  @OnEvent('diary.entry.created')
  async handleDiaryEntryCreated(event: DiaryEntryCreatedEvent): Promise<void> {
    this.logger.debug(`Diary entry created by user ${event.profileId}`);

    // Incrementar progresso para entradas do diário
    await this.achievementsService.updateProgress(
      event.profileId,
      AchievementType.DIARY_ENTRIES,
      1,
    );

    // Verificar se é uma reflexão profunda
    if (event.data.hasReflection) {
      this.logger.debug(`Deep reflection created by user ${event.profileId}`);
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.DEEP_REFLECTION,
        1,
      );
    }
  }

  private async checkPostPopularityMilestones(
    postId: string,
    authorId: string,
  ): Promise<void> {
    try {
      // Por enquanto, vamos usar uma abordagem mais direta
      // O milestone será verificado no próprio ForumService quando um post atingir likes
      this.logger.debug(
        `Checking popularity milestones for post ${postId} author ${authorId}`,
      );
    } catch (error) {
      this.logger.error('Error checking post popularity milestones:', error);
    }
  }
}

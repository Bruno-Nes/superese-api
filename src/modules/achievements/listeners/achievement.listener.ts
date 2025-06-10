import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementsService } from '../services/achievements.service';
import {
  UserActionEvent,
  ForumPostCreatedEvent,
  ForumInteractionEvent,
  FriendConnectionEvent,
  DiaryEntryCreatedEvent,
  PlanProgressEvent,
  ChatConversationEvent,
} from '../events/user-action.event';
import { AchievementType } from '../entities/achievement.entity';

@Injectable()
export class AchievementListener {
  private readonly logger = new Logger(AchievementListener.name);

  constructor(private achievementsService: AchievementsService) {}

  // Eventos sociais
  @OnEvent('forum.post.created')
  async handleForumPostCreated(event: ForumPostCreatedEvent): Promise<void> {
    this.logger.debug(`Forum post created by user ${event.profileId}`);
    // Este evento será tratado quando o post receber curtidas
  }

  @OnEvent('forum.interaction')
  async handleForumInteraction(event: ForumInteractionEvent): Promise<void> {
    this.logger.debug(
      `Forum interaction: ${event.data.interactionType} by user ${event.profileId}`,
    );
    await this.achievementsService.updateProgress(
      event.profileId,
      AchievementType.FORUM_INTERACTIONS,
      1,
    );
  }

  @OnEvent('friendship.created')
  async handleFriendConnection(event: FriendConnectionEvent): Promise<void> {
    this.logger.debug(`New friendship created for user ${event.profileId}`);
    await this.achievementsService.updateProgress(
      event.profileId,
      AchievementType.FRIEND_CONNECTIONS,
      1,
    );
  }

  @OnEvent('chat.new.conversation')
  async handleNewConversation(event: ChatConversationEvent): Promise<void> {
    this.logger.debug(`New conversation started by user ${event.profileId}`);
    if (event.data.conversationType === 'new_friend') {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.NEW_CONVERSATION,
        1,
      );
    }
  }

  // Eventos pessoais
  @OnEvent('diary.entry.created')
  async handleDiaryEntryCreated(event: DiaryEntryCreatedEvent): Promise<void> {
    this.logger.debug(`Diary entry created by user ${event.profileId}`);
    await this.achievementsService.updateProgress(
      event.profileId,
      AchievementType.DIARY_ENTRIES,
      1,
    );

    // Verificar se é uma reflexão profunda
    if (event.data.hasReflection) {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.DEEP_REFLECTION,
        1,
      );
    }
  }

  @OnEvent('plan.progress.updated')
  async handlePlanProgress(event: PlanProgressEvent): Promise<void> {
    this.logger.debug(`Plan progress updated for user ${event.profileId}`);

    if (event.data.progressType === 'increase') {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.CONSECUTIVE_PRACTICES,
        1,
      );
    }

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

  @OnEvent('gpt.consultation.help')
  async handleAIHelpSeeking(event: ChatConversationEvent): Promise<void> {
    this.logger.debug(`AI help sought by user ${event.profileId}`);
    if (event.data.conversationType === 'ai_help') {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.AI_HELP_SEEKING,
        1,
      );
    }
  }

  // Eventos especiais para posts populares
  @OnEvent('post.likes.milestone')
  async handlePostLikesMilestone(event: UserActionEvent): Promise<void> {
    this.logger.debug(
      `Post reached likes milestone for user ${event.profileId}`,
    );
    const { likesCount } = event.data;

    if (likesCount >= 10) {
      await this.achievementsService.updateProgress(
        event.profileId,
        AchievementType.POPULAR_POST,
        1,
      );
    }
  }

  // Evento genérico para ações do usuário
  @OnEvent('user.action')
  async handleUserAction(event: UserActionEvent): Promise<void> {
    this.logger.debug(
      `User action: ${event.actionType} by user ${event.profileId}`,
    );

    switch (event.actionType) {
      case 'forum_post_created':
        // Aguarda curtidas para processar
        break;
      case 'forum_interaction':
        await this.handleForumInteraction(event as ForumInteractionEvent);
        break;
      case 'friend_connection':
        await this.handleFriendConnection(event as FriendConnectionEvent);
        break;
      case 'diary_entry_created':
        await this.handleDiaryEntryCreated(event as DiaryEntryCreatedEvent);
        break;
      case 'plan_progress':
        await this.handlePlanProgress(event as PlanProgressEvent);
        break;
      case 'chat_conversation':
        await this.handleNewConversation(event as ChatConversationEvent);
        break;
      default:
        this.logger.debug(`Unhandled user action: ${event.actionType}`);
    }
  }
}

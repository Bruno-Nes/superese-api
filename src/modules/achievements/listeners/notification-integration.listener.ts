import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { AchievementUnlockedEvent } from '../events/achievement-unlocked.event';
import { ProgressNotificationEvent } from '../events/progress-notification.event';

@Injectable()
export class NotificationIntegrationListener {
  private readonly logger = new Logger(NotificationIntegrationListener.name);

  @OnEvent('achievement.unlocked')
  async handleAchievementUnlocked(
    event: AchievementUnlockedEvent,
  ): Promise<void> {
    this.logger.log(
      `Achievement unlocked: ${event.achievementName} for user ${event.profileId}`,
    );

    // Here you can integrate with your notification system
    // For example, emit a notification event
    // this.eventEmitter.emit('notification.achievement.unlocked', {
    //   recipientId: event.profileId,
    //   title: 'Nova Conquista Desbloqueada!',
    //   message: `Parabéns! Você conquistou: ${event.achievementName}`,
    //   data: {
    //     achievementId: event.achievementId,
    //     category: event.achievementCategory,
    //   },
    // });
  }

  @OnEvent('progress.notification')
  async handleProgressNotification(
    event: ProgressNotificationEvent,
  ): Promise<void> {
    this.logger.log(
      `Progress notification: ${event.progressPercentage}% on ${event.achievementName} for user ${event.profileId}`,
    );

    // Here you can integrate with your notification system
    // For example, emit a progress notification event
    // this.eventEmitter.emit('notification.achievement.progress', {
    //   recipientId: event.profileId,
    //   title: 'Progresso na Conquista',
    //   message: `Você está ${event.progressPercentage}% perto de conquistar: ${event.achievementName}`,
    //   data: {
    //     achievementName: event.achievementName,
    //     progressPercentage: event.progressPercentage,
    //     currentValue: event.currentValue,
    //     targetValue: event.targetValue,
    //   },
    // });
  }
}

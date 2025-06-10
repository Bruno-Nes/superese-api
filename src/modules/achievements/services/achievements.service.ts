import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Achievement, AchievementType } from '../entities/achievement.entity';
import { UserAchievement } from '../entities/user-achievement.entity';
import { UserProgress } from '../entities/user-progress.entity';
import { Profile } from '@modules/user/entities/profile.entity';
import { AchievementUnlockedEvent } from '../events/achievement-unlocked.event';
import { ProgressNotificationEvent } from '../events/progress-notification.event';
import { AchievementResponseDto } from '../dtos/achievement-response.dto';
import { UserAchievementResponseDto } from '../dtos/user-achievement-response.dto';

@Injectable()
export class AchievementsService {
  private readonly logger = new Logger(AchievementsService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
    @InjectRepository(UserAchievement)
    private userAchievementRepository: Repository<UserAchievement>,
    @InjectRepository(UserProgress)
    private userProgressRepository: Repository<UserProgress>,
    @InjectRepository(Profile)
    private profileRepository: Repository<Profile>,
    private eventEmitter: EventEmitter2,
  ) {}

  async getAllAchievements(): Promise<AchievementResponseDto[]> {
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
      order: { category: 'ASC', name: 'ASC' },
    });

    return achievements.map((achievement) => ({
      id: achievement.id,
      name: achievement.name,
      description: achievement.description,
      category: achievement.category,
      type: achievement.type,
      targetValue: achievement.targetValue,
      iconKey: achievement.iconKey,
    }));
  }

  async getUserAchievements(
    firebaseUid: string,
  ): Promise<UserAchievementResponseDto[]> {
    const profile = await this.profileRepository.findOne({
      where: { firebaseUid },
    });

    if (!profile) {
      return [];
    }

    const userAchievements = await this.userAchievementRepository.find({
      where: { profile: { id: profile.id } },
      relations: ['achievement'],
      order: { unlockedAt: 'DESC' },
    });

    return userAchievements.map((ua) => ({
      id: ua.id,
      name: ua.achievement.name,
      description: ua.achievement.description,
      category: ua.achievement.category,
      iconKey: ua.achievement.iconKey,
      unlockedAt: ua.unlockedAt,
      hasNewBadge: ua.hasNewBadge,
    }));
  }

  async getUserProgress(
    firebaseUid: string,
  ): Promise<AchievementResponseDto[]> {
    const profile = await this.profileRepository.findOne({
      where: { firebaseUid },
    });

    if (!profile) {
      return [];
    }

    // Buscar todas as conquistas ativas
    const achievements = await this.achievementRepository.find({
      where: { isActive: true },
    });

    // Buscar progresso do usuário
    const userProgresses = await this.userProgressRepository.find({
      where: { profile: { id: profile.id } },
      relations: ['achievement'],
    });

    // Buscar conquistas já desbloqueadas
    const unlockedAchievements = await this.userAchievementRepository.find({
      where: { profile: { id: profile.id } },
      relations: ['achievement'],
    });

    const unlockedIds = new Set(
      unlockedAchievements.map((ua) => ua.achievement.id),
    );
    const progressMap = new Map(
      userProgresses.map((up) => [up.achievement.id, up]),
    );

    return achievements.map((achievement) => {
      const progress = progressMap.get(achievement.id);
      const isCompleted = unlockedIds.has(achievement.id);
      const currentProgress = progress?.currentValue || 0;
      const progressPercentage = Math.min(
        Math.round((currentProgress / achievement.targetValue) * 100),
        100,
      );

      return {
        id: achievement.id,
        name: achievement.name,
        description: achievement.description,
        category: achievement.category,
        type: achievement.type,
        targetValue: achievement.targetValue,
        iconKey: achievement.iconKey,
        currentProgress,
        progressPercentage,
        isCompleted,
        unlockedAt: isCompleted
          ? unlockedAchievements.find(
              (ua) => ua.achievement.id === achievement.id,
            )?.unlockedAt
          : undefined,
      };
    });
  }

  async updateProgress(
    profileId: string,
    achievementType: AchievementType,
    incrementValue: number = 1,
    customData?: any,
  ): Promise<void> {
    try {
      // Buscar conquistas do tipo especificado
      const achievements = await this.achievementRepository.find({
        where: { type: achievementType, isActive: true },
      });

      if (achievements.length === 0) {
        this.logger.debug(
          `No active achievements found for type: ${achievementType}`,
        );
        return;
      }

      const profile = await this.profileRepository.findOne({
        where: { id: profileId },
      });

      if (!profile) {
        this.logger.error(`Profile not found: ${profileId}`);
        return;
      }

      for (const achievement of achievements) {
        await this.processAchievementProgress(
          profile,
          achievement,
          incrementValue,
          customData,
        );
      }
    } catch (error) {
      this.logger.error('Error updating progress:', error);
    }
  }

  private async processAchievementProgress(
    profile: Profile,
    achievement: Achievement,
    incrementValue: number,
    customData?: any,
  ): Promise<void> {
    // Verificar se já foi desbloqueada
    const existingUnlock = await this.userAchievementRepository.findOne({
      where: {
        profile: { id: profile.id },
        achievement: { id: achievement.id },
      },
    });

    if (existingUnlock) {
      return; // Já desbloqueada
    }

    // Buscar ou criar progresso
    let progress = await this.userProgressRepository.findOne({
      where: {
        profile: { id: profile.id },
        achievement: { id: achievement.id },
      },
    });

    if (!progress) {
      progress = this.userProgressRepository.create({
        profile,
        achievement,
        currentValue: 0,
        lastNotificationAt: 0,
      });
    }

    // Atualizar progresso
    progress.currentValue += incrementValue;
    await this.userProgressRepository.save(progress);

    // Calcular percentual
    const progressPercentage = Math.min(
      Math.round((progress.currentValue / achievement.targetValue) * 100),
      100,
    );

    // Verificar se deve enviar notificação de progresso
    await this.checkProgressNotifications(
      profile,
      achievement,
      progress,
      progressPercentage,
    );

    // Verificar se completou
    if (progress.currentValue >= achievement.targetValue) {
      await this.unlockAchievement(profile, achievement);
    }
  }

  private async checkProgressNotifications(
    profile: Profile,
    achievement: Achievement,
    progress: UserProgress,
    progressPercentage: number,
  ): Promise<void> {
    const milestones = [10, 50];

    for (const milestone of milestones) {
      if (
        progressPercentage >= milestone &&
        progress.lastNotificationAt < milestone
      ) {
        progress.lastNotificationAt = milestone;
        await this.userProgressRepository.save(progress);

        // Emitir evento de notificação de progresso
        this.eventEmitter.emit(
          'progress.notification',
          new ProgressNotificationEvent(
            profile.id,
            achievement.name,
            progressPercentage,
            progress.currentValue,
            achievement.targetValue,
          ),
        );
        break;
      }
    }
  }

  private async unlockAchievement(
    profile: Profile,
    achievement: Achievement,
  ): Promise<void> {
    // Criar medalha
    const userAchievement = this.userAchievementRepository.create({
      profile,
      achievement,
      hasNewBadge: true,
    });

    await this.userAchievementRepository.save(userAchievement);

    this.logger.log(
      `Achievement unlocked: ${achievement.name} for user ${profile.firebaseUid}`,
    );

    // Emitir evento de conquista desbloqueada
    this.eventEmitter.emit(
      'achievement.unlocked',
      new AchievementUnlockedEvent(
        profile.id,
        achievement.id,
        achievement.name,
        achievement.category,
      ),
    );
  }

  async markBadgeAsSeen(
    firebaseUid: string,
    achievementId: string,
  ): Promise<void> {
    const profile = await this.profileRepository.findOne({
      where: { firebaseUid },
    });

    if (!profile) {
      return;
    }

    await this.userAchievementRepository.update(
      {
        profile: { id: profile.id },
        achievement: { id: achievementId },
      },
      { hasNewBadge: false },
    );
  }

  async getNewBadgesCount(firebaseUid: string): Promise<number> {
    const profile = await this.profileRepository.findOne({
      where: { firebaseUid },
    });

    if (!profile) {
      return 0;
    }

    return this.userAchievementRepository.count({
      where: {
        profile: { id: profile.id },
        hasNewBadge: true,
      },
    });
  }
}

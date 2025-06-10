import {
  AchievementCategory,
  AchievementType,
} from '../entities/achievement.entity';

export class AchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  type: AchievementType;
  targetValue: number;
  iconKey: string;
  currentProgress?: number;
  progressPercentage?: number;
  isCompleted?: boolean;
  unlockedAt?: Date;
}

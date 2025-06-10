import { AchievementCategory } from '../entities/achievement.entity';

export class UserAchievementResponseDto {
  id: string;
  name: string;
  description: string;
  category: AchievementCategory;
  iconKey: string;
  unlockedAt: Date;
  hasNewBadge: boolean;
}

import { AchievementType } from '@modules/achievements/entities/achievement.entity';
import { AchievementSeederService } from '@modules/achievements/services/achievement-seeder.service';
import { AchievementsService } from '@modules/achievements/services/achievements.service';
import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class GameSystemValidator {
  private readonly logger = new Logger(GameSystemValidator.name);

  constructor(
    private achievementsService: AchievementsService,
    private seederService: AchievementSeederService,
  ) {}

  async validateGameSystem(): Promise<{
    success: boolean;
    message: string;
    details: any;
  }> {
    try {
      this.logger.log('🎮 Starting Gamification System Validation...');

      // 1. Test seeder
      await this.seederService.seedAchievements();
      this.logger.log('✅ Seeder test passed');

      // 2. Test get all achievements
      const achievements = await this.achievementsService.getAllAchievements();
      this.logger.log(`✅ Found ${achievements.length} achievements`);

      // 3. Test achievement types
      const socialAchievements = achievements.filter(
        (a) => a.category === 'social',
      );
      const personalAchievements = achievements.filter(
        (a) => a.category === 'personal',
      );
      const goalsAchievements = achievements.filter(
        (a) => a.category === 'goals_plans',
      );
      const generalAchievements = achievements.filter(
        (a) => a.category === 'general',
      );

      this.logger.log(`✅ Achievement distribution:
        - Social: ${socialAchievements.length}
        - Personal: ${personalAchievements.length}
        - Goals/Plans: ${goalsAchievements.length}
        - General: ${generalAchievements.length}`);

      // 4. Test achievement types enum
      const types = Object.values(AchievementType);
      this.logger.log(`✅ Achievement types defined: ${types.length}`);

      return {
        success: true,
        message: 'Gamification system validation completed successfully!',
        details: {
          totalAchievements: achievements.length,
          categories: {
            social: socialAchievements.length,
            personal: personalAchievements.length,
            goals_plans: goalsAchievements.length,
            general: generalAchievements.length,
          },
          achievementTypes: types.length,
        },
      };
    } catch (error) {
      this.logger.error('❌ Gamification system validation failed:', error);
      return {
        success: false,
        message: `Validation failed: ${error.message}`,
        details: { error: error.message },
      };
    }
  }
}

import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Achievement } from './entities/achievement.entity';
import { UserAchievement } from './entities/user-achievement.entity';
import { UserProgress } from './entities/user-progress.entity';
import { Profile } from '@modules/user/entities/profile.entity';
import { AchievementsService } from './services/achievements.service';
import { AchievementSeederService } from './services/achievement-seeder.service';
import { AchievementsController } from './controllers/achievements.controller';
import { AchievementSeederController } from './controllers/achievement-seeder.controller';
import { AchievementListener } from './listeners/achievement.listener';
import { SystemEventsListener } from './listeners/system-events.listener';
import { NotificationIntegrationListener } from './listeners/notification-integration.listener';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Achievement,
      UserAchievement,
      UserProgress,
      Profile,
    ]),
  ],
  controllers: [AchievementsController, AchievementSeederController],
  providers: [
    AchievementsService,
    AchievementSeederService,
    AchievementListener,
    SystemEventsListener,
    NotificationIntegrationListener,
  ],
  exports: [AchievementsService, AchievementSeederService],
})
export class AchievementsModule {}

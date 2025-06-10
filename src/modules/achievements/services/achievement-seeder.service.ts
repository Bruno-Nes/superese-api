import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Achievement } from '../entities/achievement.entity';
import { achievementSeeds } from '../seeds/achievement-seeds';

@Injectable()
export class AchievementSeederService {
  private readonly logger = new Logger(AchievementSeederService.name);

  constructor(
    @InjectRepository(Achievement)
    private achievementRepository: Repository<Achievement>,
  ) {}

  async seedAchievements(): Promise<void> {
    this.logger.log('Starting achievement seeding process...');

    try {
      // Check if achievements already exist
      const existingCount = await this.achievementRepository.count();

      if (existingCount > 0) {
        this.logger.log(
          `Found ${existingCount} existing achievements. Skipping seed.`,
        );
        return;
      }

      // Create achievements
      const achievements = this.achievementRepository.create(achievementSeeds);
      await this.achievementRepository.save(achievements);

      this.logger.log(
        `Successfully seeded ${achievements.length} achievements!`,
      );
    } catch (error) {
      this.logger.error('Error seeding achievements:', error);
      throw error;
    }
  }

  async reseedAchievements(): Promise<void> {
    this.logger.log('Reseeding achievements (clearing existing data)...');

    try {
      // Clear existing achievements
      await this.achievementRepository.clear();

      // Create new achievements
      const achievements = this.achievementRepository.create(achievementSeeds);
      await this.achievementRepository.save(achievements);

      this.logger.log(
        `Successfully reseeded ${achievements.length} achievements!`,
      );
    } catch (error) {
      this.logger.error('Error reseeding achievements:', error);
      throw error;
    }
  }
}

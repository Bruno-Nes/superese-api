import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AchievementSeederService } from '../services/achievement-seeder.service';

@Controller('achievements/seeder')
export class AchievementSeederController {
  constructor(private readonly seederService: AchievementSeederService) {}

  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedAchievements(): Promise<{ message: string }> {
    await this.seederService.seedAchievements();
    return { message: 'Achievements seeded successfully!' };
  }

  @Post('reseed')
  @HttpCode(HttpStatus.OK)
  async reseedAchievements(): Promise<{ message: string }> {
    await this.seederService.reseedAchievements();
    return { message: 'Achievements reseeded successfully!' };
  }
}

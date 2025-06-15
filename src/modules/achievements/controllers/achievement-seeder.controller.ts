import { Controller, Post, HttpCode, HttpStatus } from '@nestjs/common';
import { AchievementSeederService } from '../services/achievement-seeder.service';
import { Public } from 'src/lib/decorators/public-route.decorators';

@Controller('achievements/seeder')
export class AchievementSeederController {
  constructor(private readonly seederService: AchievementSeederService) {}

  @Public()
  @Post('seed')
  @HttpCode(HttpStatus.OK)
  async seedAchievements(): Promise<{ message: string }> {
    await this.seederService.seedAchievements();
    return { message: 'Achievements seeded successfully!' };
  }

  @Public()
  @Post('reseed')
  @HttpCode(HttpStatus.OK)
  async reseedAchievements(): Promise<{ message: string }> {
    await this.seederService.reseedAchievements();
    return { message: 'Achievements reseeded successfully!' };
  }
}

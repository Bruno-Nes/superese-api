import {
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Request,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AchievementsService } from '../services/achievements.service';
import { AchievementResponseDto } from '../dtos/achievement-response.dto';
import { UserAchievementResponseDto } from '../dtos/user-achievement-response.dto';

@Controller('achievements')
export class AchievementsController {
  constructor(private readonly achievementsService: AchievementsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getAllAchievements(): Promise<AchievementResponseDto[]> {
    return this.achievementsService.getAllAchievements();
  }

  @Get('my-achievements')
  @HttpCode(HttpStatus.OK)
  async getMyAchievements(
    @Request() request: any,
  ): Promise<UserAchievementResponseDto[]> {
    const firebaseUid = request.user.uid;
    return this.achievementsService.getUserAchievements(firebaseUid);
  }

  @Get('my-progress')
  @HttpCode(HttpStatus.OK)
  async getMyProgress(
    @Request() request: any,
  ): Promise<AchievementResponseDto[]> {
    const firebaseUid = request.user.uid;
    return this.achievementsService.getUserProgress(firebaseUid);
  }

  @Get('user/:userId/achievements')
  @HttpCode(HttpStatus.OK)
  async getUserAchievements(
    @Param('userId') userId: string,
  ): Promise<UserAchievementResponseDto[]> {
    return this.achievementsService.getUserAchievements(userId);
  }

  @Get('new-badges-count')
  @HttpCode(HttpStatus.OK)
  async getNewBadgesCount(@Request() request: any): Promise<{ count: number }> {
    const firebaseUid = request.user.uid;
    const count = await this.achievementsService.getNewBadgesCount(firebaseUid);
    return { count };
  }

  @Patch('mark-badge-seen/:achievementId')
  @HttpCode(HttpStatus.OK)
  async markBadgeAsSeen(
    @Param('achievementId') achievementId: string,
    @Request() request: any,
  ): Promise<{ success: boolean }> {
    const firebaseUid = request.user.uid;
    await this.achievementsService.markBadgeAsSeen(firebaseUid, achievementId);
    return { success: true };
  }

  @Post('initialize-my-achievements')
  @HttpCode(HttpStatus.OK)
  async initializeMyAchievements(
    @Request() request: any,
  ): Promise<{ message: string; initialized: number }> {
    const firebaseUid = request.user.uid;

    // Buscar o profile do usuário
    const profile = await this.achievementsService['profileRepository'].findOne(
      {
        where: { firebaseUid },
      },
    );

    if (!profile) {
      throw new Error('Profile not found');
    }

    // Verificar se já tem progresso
    const existingProgress = await this.achievementsService[
      'userProgressRepository'
    ].find({
      where: { profile: { id: profile.id } },
    });

    if (existingProgress.length > 0) {
      return {
        message: `User already has ${existingProgress.length} achievement progress records initialized`,
        initialized: existingProgress.length,
      };
    }

    // Inicializar conquistas
    await this.achievementsService.initializeUserAchievements(profile.id);

    // Contar quantos foram criados
    const newProgress = await this.achievementsService[
      'userProgressRepository'
    ].find({
      where: { profile: { id: profile.id } },
    });

    return {
      message: `Successfully initialized achievement tracking for user`,
      initialized: newProgress.length,
    };
  }
}

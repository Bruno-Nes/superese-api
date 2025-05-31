import { Controller, Get, Post, Request, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@modules/auth/guards/auth.guard';
import { RecoveryStatusService } from '../services/recovery-status.service';

@Controller('recovery')
export class RecoveryStatusController {
  constructor(private readonly recoveryService: RecoveryStatusService) {}

  @Get('clean-time')
  @UseGuards(AuthGuard)
  async getCleanTime(@Request() request: any) {
    const firebaseUserId = request.user.uid;
    return this.recoveryService.getCleanTime(firebaseUserId);
  }

  @Post('relapse')
  @UseGuards(AuthGuard)
  async registerRelapse(@Request() request: any) {
    const firebaseUserId = request.user.uid;
    return this.recoveryService.markRelapse(firebaseUserId);
  }

  @Get('summary')
  @UseGuards(AuthGuard)
  async getRecoverySummary(@Request() request: any) {
    const firebaseUserId = request.user.uid;
    return await this.recoveryService.getRecoverySummary(firebaseUserId);
  }
}

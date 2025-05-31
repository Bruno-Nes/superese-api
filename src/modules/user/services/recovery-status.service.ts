// recovery-status.service.ts
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserService } from './user.service';
import { Profile } from '../entities/profile.entity';
import { RecoveryStatus } from '../entities/recovery-status.entity';
import { differenceInDays } from 'date-fns';

@Injectable()
export class RecoveryStatusService {
  constructor(
    @InjectRepository(RecoveryStatus)
    private readonly recoveryRepo: Repository<RecoveryStatus>,
    @InjectRepository(Profile)
    private readonly userRepository: Repository<Profile>,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
  ) {}

  async getCleanTime(
    firebaseUid: string,
  ): Promise<{ days: number; hours: number; minutes: number }> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new Error('Profile not found!');
    }
    const id = profile.id;
    const status = await this.recoveryRepo.findOne({
      where: { profile: { id } },
      order: { createdAt: 'DESC' },
    });

    if (!status) {
      return { days: 0, hours: 0, minutes: 0 }; // Ou lançar exceção
    }

    const now = new Date();
    const diffMs = now.getTime() - new Date(status.cleanSince).getTime();

    const minutes = Math.floor(diffMs / (1000 * 60)) % 60;
    const hours = Math.floor(diffMs / (1000 * 60 * 60)) % 24;
    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    return { days, hours, minutes };
  }

  async markRelapse(firebaseUid: string): Promise<RecoveryStatus> {
    const profile: Profile =
      await this.userService.findUserByFirebaseUid(firebaseUid);
    if (!profile) {
      throw new Error('Profile not found!');
    }
    const id = profile.id;
    const newStatus = this.recoveryRepo.create({
      profile: { id },
      cleanSince: new Date(),
    });

    return await this.recoveryRepo.save(newStatus);
  }

  // calcula o gasto estimado desde a ultima recaida
  async getRecoverySummary(firebaseUid: string) {
    const profile = await this.userRepository.findOne({
      where: { firebaseUid },
      relations: ['recoveryStatuses'],
    });

    const currentStatus = profile.recoveryStatuses.find(
      (status) => status.profile.id === profile.id,
    );
    if (!currentStatus || !profile.averageBettingExpensePerWeek) {
      return {
        daysClean: 0,
        estimatedSaved: 0,
        averageWeeklyExpense: null,
      };
    }

    const today = new Date();
    const start = new Date(currentStatus.cleanSince);
    const daysClean = differenceInDays(today, start);

    const estimatedSaved =
      (daysClean / 7) * Number(profile.averageBettingExpensePerWeek);

    return {
      daysClean,
      averageWeeklyExpense: profile.averageBettingExpensePerWeek,
      estimatedSaved: parseFloat(estimatedSaved.toFixed(2)),
    };
  }
}

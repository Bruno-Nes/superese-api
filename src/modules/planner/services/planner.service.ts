import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { Goal } from '../entities/goal.entity';
import { CreatePlanDTO } from '../dtos/create-plan.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Profile } from '@modules/user/entities/profile.entity';
import { CreateGoalDTO } from '../dtos/create-goal.dto';

@Injectable()
export class PlannerService {
  constructor(
    @InjectRepository(Plan)
    private readonly planRepository: Repository<Plan>,

    @InjectRepository(Goal)
    private readonly goalRepository: Repository<Goal>,

    @InjectRepository(Profile)
    private readonly profileRepository: Repository<Profile>,
  ) {}

  async createPlan(input: CreatePlanDTO, firebaseUid: string) {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const profileId = profile.id;
    const { duration, description, goals } = input;

    const plan = this.planRepository.create({
      description,
      duration,
      progress: 0,
      completed: false,
      profile: { id: profileId },
    });

    this.createGoals(goals);

    await this.goalRepository.save(plan);
  }

  async increaseProgress(planId: string) {
    const plan = await this.planRepository.findOneBy({ id: planId });
    if (!plan) {
      throw new Error('Plan not found!');
    }

    if (!plan.completed) {
      plan.progress += 1;
    }

    if (plan.progress === plan.duration) {
      plan.completed = true;
    }

    await this.planRepository.save(plan);
  }

  async decreaseProgress(planId: string) {
    const plan = await this.planRepository.findOneBy({ id: planId });
    if (!plan) {
      throw new Error('Plan not found!');
    }

    if (plan.completed) {
      plan.completed = false;
    }

    plan.progress -= 1;

    if (plan.progress < 1) {
      plan.progress = 0;
    }

    await this.planRepository.save(plan);
  }

  async findAllByProfile(firebaseUid: string): Promise<Plan[]> {
    const profile: Profile = await this.profileRepository.findOneBy({
      firebaseUid,
    });
    if (!profile) {
      throw new NotFoundException('Profile not foung!');
    }

    const profileId = profile.id;

    return this.planRepository.find({
      where: {
        profile: { id: profileId },
      },
      relations: ['goals'],
    });
  }

  async createGoals(goals: CreateGoalDTO[]) {
    if (goals.length < 1) {
      throw new Error('Therer is no goals to save');
    }

    return await this.goalRepository.insert(goals);
  }
}

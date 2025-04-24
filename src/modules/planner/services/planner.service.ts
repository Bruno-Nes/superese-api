import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { Plan } from '../entities/plan.entity';
import { Goal } from '../entities/goal.entity';
import { CreatePlanDTO } from '../dtos/create-plan.dto';

@Injectable()
export class PlannerService {
  constructor(
    private readonly planRepository: Repository<Plan>,
    private readonly goalRepository: Repository<Goal>,
  ) {}

  async createPlan(input: CreatePlanDTO, profileId: string) {
    const { endDate, initialDate, description } = input;
    if (endDate < initialDate) {
      throw new Error('Initial date cannot be greater than end date');
    }

    const plan = this.planRepository.create({
      description,
      initialDate,
      endDate,
      profile: { id: profileId },
    });

    await this.goalRepository.save(plan);
  }

  async createGoals(input) {

  }
}

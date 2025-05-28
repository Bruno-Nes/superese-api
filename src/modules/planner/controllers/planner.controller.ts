import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Request,
} from '@nestjs/common';
import { PlannerService } from '../services/planner.service';
import { Plan } from '../entities/plan.entity';
import { CreatePlanDTO } from '../dtos/create-plan.dto';

@Controller('planner')
export class PlannerController {
  constructor(private readonly planService: PlannerService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createPlan(@Body() body: CreatePlanDTO, @Request() request: any) {
    const firebaseUserId = request.user.uid;
    return await this.planService.createPlan(body, firebaseUserId);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  async getPlansByProfile(@Request() request: any): Promise<Plan[]> {
    const firebaseUserId = request.user.uid;
    return this.planService.findAllByProfile(firebaseUserId);
  }

  @Patch(':planId/increase')
  async increaseProgress(@Param('planId') id: string) {
    await this.planService.increaseProgress(id);
  }

  @Patch(':planId/decrease')
  async decreaseProgress(@Param('planId') id: string) {
    await this.planService.decreaseProgress(id);
  }
}

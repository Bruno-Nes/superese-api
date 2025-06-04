import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { Achievement } from './entities/achievement.entity';
import { Medal } from './entities/medal.entity';
import { Plan } from './entities/plan.entity';
import { PlannerController } from './controllers/planner.controller';
import { PlannerService } from './services/planner.service';
import { Profile } from '@modules/user/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Goal, Achievement, Medal, Plan, Profile]),
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}

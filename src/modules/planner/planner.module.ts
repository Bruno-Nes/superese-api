import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { Plan } from './entities/plan.entity';
import { Observation } from './entities/observation.entity';
import { MotivationalReport } from './entities/motivational-report.entity';
import { PlannerController } from './controllers/planner.controller';
import { PlannerService } from './services/planner.service';
import { Profile } from '@modules/user/entities/profile.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Goal,
      Plan,
      Observation,
      MotivationalReport,
      Profile,
    ]),
  ],
  controllers: [PlannerController],
  providers: [PlannerService],
  exports: [PlannerService],
})
export class PlannerModule {}

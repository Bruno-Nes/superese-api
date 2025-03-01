import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Goal } from './entities/goal.entity';
import { Achievement } from './entities/achievement.entity';
import { Medal } from './entities/medal.entity';
import { Plan } from './entities/plan.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Goal, Achievement, Medal, Plan])],
  controllers: [],
  providers: [],
})
export class UserModule {}

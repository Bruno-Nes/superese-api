import { CreateGoalDTO } from './create-goal.dto';

export class CreatePlanDTO {
  description: string;
  duration: number;
  goals: CreateGoalDTO[];
}

export class PlanResponseDTO {
  id: string;
  description: string;
  duration: number;
  progress: number;
  completed: boolean;
  goals: GoalResponseDTO[];
}

export class GoalResponseDTO {
  id: string;
  description: string;
}

export class DeletePlanResponseDTO {
  success: boolean;
  message: string;
}

export class ProgressUpdateResponseDTO {
  id: string;
  progress: number;
  completed: boolean;
}

import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Plan } from './plan.entity';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => Plan, (plan) => plan.goals, { onDelete: 'CASCADE' })
  plan: Plan;
}

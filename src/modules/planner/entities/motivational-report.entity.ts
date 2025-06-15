import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Plan } from './plan.entity';

@Entity('motivational_reports')
export class MotivationalReport {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('text')
  content: string;

  @Column({ name: 'plan_id' })
  planId: string;

  @ManyToOne(() => Plan, (plan) => plan.motivationalReports, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'plan_id' })
  plan: Plan;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

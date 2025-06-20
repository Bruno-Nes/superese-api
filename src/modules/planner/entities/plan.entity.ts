import { Profile } from '@modules/user/entities/profile.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Goal } from './goal.entity';
import { Observation } from './observation.entity';
import { MotivationalReport } from './motivational-report.entity';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  description: string;

  @Column()
  duration: number;

  @Column()
  progress: number;

  @Column({ default: false })
  completed: boolean;

  @ManyToOne(() => Profile, (profile) => profile.plans)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @OneToMany(() => Goal, (goal) => goal.plan, { cascade: true })
  goals: Goal[];

  @OneToMany(() => Observation, (observation) => observation.plan, {
    cascade: true,
  })
  observations: Observation[];

  @OneToMany(() => MotivationalReport, (report) => report.plan, {
    cascade: true,
  })
  motivationalReports: MotivationalReport[];
}

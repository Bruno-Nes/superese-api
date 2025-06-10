import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Profile } from '@modules/user/entities/profile.entity';
import { Achievement } from './achievement.entity';

@Entity('user_progress')
export class UserProgress {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.userProgresses)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @ManyToOne(() => Achievement, (achievement) => achievement.userProgresses)
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;

  @Column({ default: 0 })
  currentValue: number;

  @Column({ default: 0 })
  lastNotificationAt: number; // Percentual da última notificação enviada (10, 50, 100)

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

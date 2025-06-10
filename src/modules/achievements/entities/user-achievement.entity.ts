import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Profile } from '@modules/user/entities/profile.entity';
import { Achievement } from './achievement.entity';

@Entity('user_achievements')
export class UserAchievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.userAchievements)
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;

  @ManyToOne(() => Achievement, (achievement) => achievement.userAchievements)
  @JoinColumn({ name: 'achievement_id' })
  achievement: Achievement;

  @Column({ default: false })
  hasNewBadge: boolean; // Flag para animação no frontend

  @CreateDateColumn()
  unlockedAt: Date;
}

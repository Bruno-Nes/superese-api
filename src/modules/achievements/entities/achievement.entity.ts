import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserAchievement } from './user-achievement.entity';
import { UserProgress } from './user-progress.entity';

export enum AchievementCategory {
  SOCIAL = 'social',
  PERSONAL = 'personal',
  GOALS_PLANS = 'goals_plans',
  GENERAL = 'general',
}

export enum AchievementType {
  // Sociais
  FRIEND_CONNECTIONS = 'friend_connections',
  FORUM_INTERACTIONS = 'forum_interactions',
  POPULAR_POST = 'popular_post',
  NEW_CONVERSATION = 'new_conversation',

  // Pessoais
  PLAN_COMPLETION = 'plan_completion',
  CONSECUTIVE_PRACTICES = 'consecutive_practices',
  DIARY_ENTRIES = 'diary_entries',

  // Metas/Planos
  AI_PLAN_COMPLETION = 'ai_plan_completion',
  WEEKLY_GOALS = 'weekly_goals',
  PERSONAL_GOAL = 'personal_goal',

  // Geral
  DEEP_REFLECTION = 'deep_reflection',
  AI_HELP_SEEKING = 'ai_help_seeking',
}

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'text' })
  description: string;

  @Column({
    type: 'enum',
    enum: AchievementCategory,
  })
  category: AchievementCategory;

  @Column({
    type: 'enum',
    enum: AchievementType,
  })
  type: AchievementType;

  @Column()
  targetValue: number;

  @Column({ nullable: true })
  iconKey: string; // Chave para o frontend identificar qual ícone usar

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(
    () => UserAchievement,
    (userAchievement) => userAchievement.achievement,
  )
  userAchievements: UserAchievement[];

  @OneToMany(() => UserProgress, (userProgress) => userProgress.achievement)
  userProgresses: UserProgress[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

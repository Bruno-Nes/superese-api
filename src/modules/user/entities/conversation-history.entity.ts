import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

export type MoodType =
  | 'ansiedade'
  | 'impulsividade'
  | 'culpa'
  | 'vergonha'
  | 'desesperança';

@Entity('conversations_history')
export class ConversationHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: ['ansiedade', 'impulsividade', 'culpa', 'vergonha', 'desesperança'],
  })
  mood: MoodType;

  @Column({ type: 'text' })
  userInput: string;

  @Column({ type: 'text' })
  gptResponse: string;

  @CreateDateColumn()
  createdAt: Date;

  @ManyToOne(() => Profile, (profile) => profile.conversarionHistory, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'profile_id' })
  profile: Profile;
}

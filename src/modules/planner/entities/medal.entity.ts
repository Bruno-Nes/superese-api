import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { Achievement } from './achievement.entity';

@Entity('medals')
export class Medal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  descricao: string;

  @ManyToOne(() => Achievement, (achievement) => achievement.medals)
  achievement: Achievement;
}

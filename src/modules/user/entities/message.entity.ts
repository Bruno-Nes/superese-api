import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity()
export class Message {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => Profile, (user) => user.sentMessages)
  sender: Profile;

  @ManyToOne(() => Profile, (user) => user.receivedMessages)
  receiver: Profile;

  @Column()
  content: string;

  @CreateDateColumn()
  createdAt: Date;
}

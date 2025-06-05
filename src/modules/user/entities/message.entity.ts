import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Chat } from './chat.entity';

@Entity('message')
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Chat, (chat) => chat.messages, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'chat_id' })
  chat: Chat;

  @ManyToOne(() => Profile, (user) => user.sentMessages, {
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'senderId' })
  sender: Profile;

  @Column('text')
  content: string;

  @Column({ name: 'is_read', default: false })
  isRead: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

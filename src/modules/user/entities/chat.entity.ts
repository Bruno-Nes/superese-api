import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Message } from './message.entity';

@Entity('chats')
export class Chat {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, {
    eager: true,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'user1_id' })
  user1: Profile;

  @ManyToOne(() => Profile, {
    eager: true,
    onDelete: 'NO ACTION',
    onUpdate: 'NO ACTION',
  })
  @JoinColumn({ name: 'user2_id' })
  user2: Profile;

  @OneToMany(() => Message, (message) => message.chat, { cascade: true })
  messages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

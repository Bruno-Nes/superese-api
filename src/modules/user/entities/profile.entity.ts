import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Post } from 'src/modules/forum/entities/post.entity';
import { Comment } from 'src/modules/forum/entities/comment.entity';
import { Plan } from 'src/modules/planner/entities/plan.entity';
import { Achievement } from 'src/modules/planner/entities/achievement.entity';
import { Like } from 'src/modules/forum/entities/like.entity';
import { Folder } from '@modules/diary/entities/folder.entity';
import { Friendship } from './friendship.entity';
import { RecoveryStatus } from './recovery-status.entity';
import { Message } from './message.entity';
import { ConversationHistory } from './conversation-history.entity';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  firebaseUid: string;

  @Column()
  googleUid: string;

  @Column({ length: 30 })
  firstName?: string;

  @Column({ length: 30 })
  lastName?: string;

  @Column({ length: 60, unique: true, nullable: false })
  email: string;

  @Column()
  birthdayDate?: Date;

  @Column({ length: 20, unique: true })
  username?: string;

  @Column({ length: 1024, nullable: true })
  about?: string;

  @Column({ length: 512, nullable: true })
  avatar?: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ length: 10, nullable: true })
  gender?: string;

  @OneToMany(() => Friendship, (friendship) => friendship.requester)
  sentFriendRequests: Friendship[];

  @OneToMany(() => Friendship, (friendship) => friendship.addressee)
  receivedFriendRequests: Friendship[];

  @OneToMany(() => Post, (post) => post.profile)
  posts: Post[];

  @OneToMany(() => ConversationHistory, (conv) => conv.profile)
  conversarionHistory: ConversationHistory[];

  @OneToMany(() => RecoveryStatus, (status) => status.profile, {
    cascade: true,
  })
  recoveryStatuses: RecoveryStatus[];

  @Column('decimal', { nullable: true, precision: 10, scale: 2 })
  averageBettingExpensePerWeek: number | null;

  @OneToMany(() => Folder, (folder) => folder.profile)
  folders: Folder[];

  @OneToMany(() => Plan, (plan) => plan.profile)
  plans: Plan[];

  @OneToMany(() => Achievement, (achievement) => achievement.profile)
  achievements: Achievement[];

  @OneToOne(() => Comment, (comment) => comment.profile)
  comments: Comment[];

  @OneToOne(() => Like, (like) => like.profile)
  like: Like;

  @OneToMany(() => Message, (message) => message.sender)
  sentMessages: Message[];

  @OneToMany(() => Message, (message) => message.receiver)
  receivedMessages: Message[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

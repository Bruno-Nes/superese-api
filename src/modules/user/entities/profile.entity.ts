import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Post } from 'src/modules/forum/entities/post.entity';
import { Comment } from 'src/modules/forum/entities/comment.entity';
import { Plan } from 'src/modules/planner/entities/plan.entity';
import { Like } from 'src/modules/forum/entities/like.entity';
import { Folder } from '@modules/diary/entities/folder.entity';
import { Friendship } from './friendship.entity';
import { RecoveryStatus } from './recovery-status.entity';
import { Message } from './message.entity';
import { ConversationHistory } from './conversation-history.entity';
import { UserAchievement } from '@modules/achievements/entities/user-achievement.entity';
import { UserProgress } from '@modules/achievements/entities/user-progress.entity';

@Entity({ name: 'profiles' })
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column()
  firebaseUid: string;

  @Column({ nullable: true })
  googleUid?: string;

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

  @OneToMany(() => Friendship, (friendship) => friendship.requester, {
    lazy: true,
  })
  sentFriendRequests: Promise<Friendship[]>;

  @OneToMany(() => Friendship, (friendship) => friendship.addressee, {
    lazy: true,
  })
  receivedFriendRequests: Promise<Friendship[]>;

  @OneToMany(() => Post, (post) => post.profile, {
    lazy: true,
  })
  posts: Promise<Post[]>;

  @OneToMany(() => ConversationHistory, (conv) => conv.profile, {
    lazy: true,
  })
  conversarionHistory: Promise<ConversationHistory[]>;

  @OneToMany(() => RecoveryStatus, (status) => status.profile, {
    cascade: true,
  })
  recoveryStatuses: RecoveryStatus[];

  @Column({ default: false })
  isPrivate: boolean;

  @Column('decimal', { nullable: true, precision: 10, scale: 2 })
  averageBettingExpensePerWeek: number | null;

  @OneToMany(() => Folder, (folder) => folder.profile, {
    lazy: true,
  })
  folders: Promise<Folder[]>;

  @OneToMany(() => Plan, (plan) => plan.profile, {
    lazy: true,
  })
  plans: Promise<Plan[]>;

  @OneToMany(() => Comment, (comment) => comment.profile)
  comments: Comment[];

  @OneToMany(() => Like, (like) => like.profile)
  likes: Like[];

  @OneToMany(() => Message, (message) => message.sender, {
    lazy: true,
  })
  sentMessages: Promise<Message[]>;

  @OneToMany(
    () => UserAchievement,
    (userAchievement) => userAchievement.profile,
    {
      lazy: true,
    },
  )
  userAchievements: Promise<UserAchievement[]>;

  @OneToMany(() => UserProgress, (userProgress) => userProgress.profile, {
    lazy: true,
  })
  userProgresses: Promise<UserProgress[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

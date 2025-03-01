import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { Post } from 'src/modules/forum/entities/post.entity';
import { Comment } from 'src/modules/forum/entities/comment.entity';
import { Plan } from 'src/modules/planner/entities/plan.entity';
import { Achievement } from 'src/modules/planner/entities/achievement.entity';
import { Like } from 'src/modules/forum/entities/like.entity';
import { Folder } from '@modules/diary/entities/folder.entity';
import { Friendship } from './friendship.entity';

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ length: 30 })
  firstName: string;

  @Column({ length: 30 })
  lastName: string;

  @Column({ length: 60, unique: true, nullable: true })
  email: string;

  @Column({ select: false })
  password: string;

  @Column()
  birthdayDate: Date;

  @Column({ length: 10, nullable: true })
  role?: string;

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

  @OneToMany(() => Post, (post) => post.user)
  posts: Post[];

  @OneToMany(() => Folder, (folder) => folder.user)
  folders: Folder[];

  @OneToMany(() => Plan, (plan) => plan.user)
  plans: Plan[];

  @OneToMany(() => Achievement, (achievement) => achievement.user)
  achievements: Achievement[];

  @OneToOne(() => Comment, (comment) => comment.user)
  comments: Comment[];

  @OneToOne(() => Like, (like) => like.user)
  like: Like;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

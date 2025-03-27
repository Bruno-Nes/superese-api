import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Like } from './like.entity';
import { Comment } from './comment.entity';
import { Profile } from '@modules/user/entities/profile.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (profile) => profile.posts, { onDelete: 'CASCADE' })
  profile: Profile;

  @Column({ type: 'text' })
  title: string;

  @Column({ type: 'text' })
  content: string;

  @OneToMany(() => Like, (like) => like.post)
  likes: Like[];

  @Column({ default: 0 })
  commentsCount: number;

  @OneToMany(() => Comment, (comment) => comment.post)
  comments: Comment[];

  @Column({ default: 0 })
  likesCount: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

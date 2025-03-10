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
import { User } from 'src/modules/user/entities/user.entity';

@Entity('posts')
export class Post {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.posts, { onDelete: 'CASCADE' })
  user: User;

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

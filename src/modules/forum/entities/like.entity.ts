import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Unique,
  OneToOne,
  JoinColumn,
  Column,
} from 'typeorm';
import { Post } from './post.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity()
@Unique(['userId', 'postId'])
export class Like {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.like, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ManyToOne(() => Post, (post) => post.likes, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'postId' })
  post: Post;

  @Column({ type: 'uuid' })
  userId: string;

  @Column({ type: 'uuid' })
  postId: string;

  @CreateDateColumn()
  createdAt: Date;
}

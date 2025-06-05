import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from '@modules/user/entities/profile.entity';
import { Post } from '@modules/forum/entities/post.entity';
import { Comment } from '@modules/forum/entities/comment.entity';
import { Friendship } from '@modules/user/entities/friendship.entity';
import { Chat } from '@modules/user/entities/chat.entity';

export enum NotificationType {
  LIKE = 'like',
  COMMENT = 'comment',
  FRIEND_REQUEST = 'friend_request',
  FRIEND_ACCEPTED = 'friend_accepted',
  REPLY = 'reply',
  MESSAGE = 'message',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

@Entity({ name: 'notifications' })
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
  })
  type: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    default: NotificationStatus.UNREAD,
  })
  status: NotificationStatus;

  @Column()
  message: string;

  // Usuário que vai receber a notificação
  @ManyToOne(() => Profile, { eager: true })
  @JoinColumn({ name: 'recipient_id' })
  recipient: Profile;

  // Usuário que causou a notificação (quem curtiu, comentou, etc.)
  @ManyToOne(() => Profile, { eager: true })
  @JoinColumn({ name: 'actor_id' })
  actor: Profile;

  // Referências opcionais para diferentes tipos de entidades
  @ManyToOne(() => Post, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'post_id' })
  post?: Post;

  @ManyToOne(() => Comment, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'comment_id' })
  comment?: Comment;

  @ManyToOne(() => Friendship, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'friendship_id' })
  friendship?: Friendship;

  @ManyToOne(() => Chat, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'chat_id' })
  chat?: Chat;

  // Dados adicionais em JSON para flexibilidade
  @Column({ type: 'json', nullable: true })
  metadata?: any;

  @CreateDateColumn()
  createdAt: Date;
}

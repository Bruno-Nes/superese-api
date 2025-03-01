import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FriendshipStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
}

@Entity('friendship')
@Unique(['requester', 'addressee'])
export class Friendship {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, (user) => user.sentFriendRequests, {
    onDelete: 'CASCADE',
  })
  requester: User;

  @ManyToOne(() => User, (user) => user.receivedFriendRequests, {
    onDelete: 'CASCADE',
  })
  addressee: User;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @CreateDateColumn()
  createdAt: Date;
}

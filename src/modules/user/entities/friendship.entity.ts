import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  Unique,
  CreateDateColumn,
  JoinColumn,
} from 'typeorm';
import { Profile } from './profile.entity';

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

  @ManyToOne(() => Profile, (user) => user.sentFriendRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'requester_id' })
  requester: Profile;

  @ManyToOne(() => Profile, (user) => user.receivedFriendRequests, {
    onDelete: 'CASCADE',
  })
  @JoinColumn({ name: 'addressee_id' })
  addressee: Profile;

  @Column({
    type: 'enum',
    enum: FriendshipStatus,
    default: FriendshipStatus.PENDING,
  })
  status: FriendshipStatus;

  @CreateDateColumn()
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}

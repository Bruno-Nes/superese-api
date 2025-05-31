// recovery-status.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Profile } from './profile.entity';

@Entity({ name: 'recovery_status' })
export class RecoveryStatus {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Profile, (user) => user.recoveryStatuses)
  profile: Profile;

  @Column({ type: 'timestamp' })
  cleanSince: Date;

  @CreateDateColumn()
  createdAt: Date;
}

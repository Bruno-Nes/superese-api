import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Diary } from './diary.entity';
import { User } from '@modules/user/entities/user.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => User, (user) => user.folders, { onDelete: 'CASCADE' })
  user: User;

  @OneToMany(() => Diary, (diary) => diary.folder, { cascade: true })
  diaries: Diary[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

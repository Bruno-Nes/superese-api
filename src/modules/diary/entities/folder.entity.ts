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
import { Profile } from '@modules/user/entities/profile.entity';

@Entity('folders')
export class Folder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @ManyToOne(() => Profile, (profile) => profile.folders, {
    onDelete: 'CASCADE',
  })
  profile: Profile;
  @OneToMany(() => Diary, (diary) => diary.folder, {
    cascade: true,
    lazy: true,
  })
  diaries: Promise<Diary[]>;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

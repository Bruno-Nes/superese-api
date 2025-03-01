import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Folder } from './folder.entity';
import { Entry } from './entry.entity';

@Entity('diaries')
export class Diary {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ManyToOne(() => Folder, (folder) => folder.diaries, { onDelete: 'CASCADE' })
  folder: Folder;

  @OneToMany(() => Entry, (entry) => entry.diary, { cascade: true })
  entries: Entry[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

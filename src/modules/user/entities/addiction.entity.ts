import { Column, Entity, OneToOne, PrimaryGeneratedColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('addictions')
export class Addiction {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, (user) => user.like, { onDelete: 'CASCADE' })
  user: User;

  @Column({ length: 30 })
  name: string;
}

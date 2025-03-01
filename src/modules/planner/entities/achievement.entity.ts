import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Medal } from './medal.entity';
import { User } from 'src/modules/user/entities/user.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @OneToMany(() => Medal, (medal) => medal.achievement)
  medals: Medal[];

  @ManyToOne(() => User, (user) => user.achievements)
  userId: string;

  achievementDate: Date;
  user: any;
}

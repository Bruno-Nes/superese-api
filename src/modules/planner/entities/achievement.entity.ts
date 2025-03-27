import { Entity, ManyToOne, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import { Medal } from './medal.entity';
import { Profile } from '@modules/user/entities/profile.entity';

@Entity('achievements')
export class Achievement {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @OneToMany(() => Medal, (medal) => medal.achievement)
  medals: Medal[];

  @ManyToOne(() => Profile, (profile) => profile.achievements)
  profile: string;

  achievementDate: Date;
}

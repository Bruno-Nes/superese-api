import { Profile } from '@modules/user/entities/profile.entity';
import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';

@Entity('plans')
export class Plan {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ type: 'timestamptz' })
  initialDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ManyToOne(() => Profile, (profile) => profile.plans)
  profile: Profile;
}

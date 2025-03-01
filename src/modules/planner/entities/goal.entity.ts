import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('goals')
export class Goal {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  descricao: string;

  @Column({ default: false })
  completed: boolean;

  @Column({ type: 'timestamptz' })
  endDate: Date;
}

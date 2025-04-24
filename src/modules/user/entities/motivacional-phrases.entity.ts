import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

@Entity({ name: 'motivational_phrases' })
export class MotivacionalPhrases {
  @PrimaryGeneratedColumn('uuid')
  id: string = uuidv4();

  @Column({ length: 50 })
  humor: string;

  @Column()
  text: string;

  @Column({ default: true })
  active: boolean;
}

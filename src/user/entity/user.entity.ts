import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  userId: string = uuidv4();

  @Column({ length: 30 })
  firstName: string;

  @Column({ length: 30 })
  lastName: string;

  @Column({ length: 60, unique: true, nullable: true })
  email?: string;

  @Column({ select: false })
  password: string;

  @Column({ length: 10, nullable: true })
  role?: string;

  @Column({ length: 1024, nullable: true })
  about?: string;

  @Column({ length: 512, nullable: true })
  avatar?: string;

  @Column({ length: 20, nullable: true })
  phoneNumber?: string;

  @Column({ length: 10, nullable: true })
  gender?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.password) {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
    }
  }

  async comparePassword(plainPassword: string): Promise<boolean> {
    return bcrypt.compare(plainPassword, this.password);
  }
}

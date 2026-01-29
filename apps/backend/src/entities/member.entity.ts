import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
} from 'typeorm';
import { Role, RoleValues } from '@toy-monorepo/types';

@Entity('members')
export class Member {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: string;

  @Column({ type: 'text' })
  username: string;

  @Column({ type: 'text' })
  name: string;

  @Column({ type: 'text' })
  password: string;

  @Column({ type: 'text' })
  phone: string;

  @Column({ type: 'text' })
  email: string;

  @Column({ type: 'text', default: RoleValues.user })
  role: Role;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}

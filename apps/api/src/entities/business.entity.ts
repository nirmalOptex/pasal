import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Branch } from './branch.entity';
import { Role } from './role.entity';
import { User } from './user.entity';

@Entity('businesses')
export class Business {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email?: string;

  @Column({ type: 'text', nullable: true })
  logo_url?: string;

  @Column({ type: 'varchar', length: 10, default: 'NPR' })
  currency!: string;

  @Column({ type: 'varchar', length: 50, default: 'Asia/Kathmandu' })
  timezone!: string;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Branch, (branch) => branch.business)
  branches!: Branch[];

  @OneToMany(() => Role, (role) => role.business)
  roles!: Role[];

  @OneToMany(() => User, (user) => user.business)
  users!: User[];
}

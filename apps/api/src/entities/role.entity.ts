import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Unique,
} from 'typeorm';
import { Business } from './business.entity';

@Entity('roles')
@Unique(['business_id', 'name'])
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  business_id!: string;

  @ManyToOne(() => Business, (business) => business.roles, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @Column({ type: 'jsonb', default: () => "'[]'" })
  permissions!: string[];

  @Column({ type: 'boolean', default: false })
  is_system!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';

@Entity('loyalty_rules')
export class LoyaltyRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  business_id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 100 })
  spend_amount!: number; // e.g. Rs 100

  @Column({ type: 'int', default: 1 })
  points_earned!: number; // e.g. 1 point

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 1 })
  point_redemption_value!: number; // e.g. 1 point = Rs. 1

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

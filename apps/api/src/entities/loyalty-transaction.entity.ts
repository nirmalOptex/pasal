import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { Customer } from './customer.entity';
import { Order } from './order.entity';
import { User } from './user.entity';
import { LoyaltyTransactionType } from '@chhiyapasal/shared-types';

@Entity('loyalty_transactions')
export class LoyaltyTransaction {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  business_id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'uuid' })
  @Index()
  customer_id!: string;

  @ManyToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  order_id?: string | null;

  @ManyToOne(() => Order, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'order_id' })
  order?: Order | null;

  @Column({
    type: 'enum',
    enum: LoyaltyTransactionType,
  })
  type!: LoyaltyTransactionType;

  @Column({ type: 'int' })
  points!: number; // + for earn/adjust, - for redeem

  @Column({ type: 'int' })
  balance_after!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

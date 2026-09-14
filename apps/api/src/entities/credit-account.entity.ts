import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToOne,
  OneToMany,
  JoinColumn,
  Index,
  Unique,
} from 'typeorm';
import { Business } from './business.entity';
import { Customer } from './customer.entity';
import { CreditTransaction } from './credit-transaction.entity';

@Entity('credit_accounts')
@Unique(['business_id', 'customer_id'])
export class CreditAccount {
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

  @OneToOne(() => Customer, (c) => c.credit_account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer!: Customer;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  balance!: number; // outstanding amount customer owes

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  credit_limit?: number | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => CreditTransaction, (t) => t.credit_account)
  transactions!: CreditTransaction[];
}

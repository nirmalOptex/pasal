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
import { CreditAccount } from './credit-account.entity';
import { Invoice } from './invoice.entity';
import { User } from './user.entity';
import { CreditTransactionType } from '@chhiyapasal/shared-types';

@Entity('credit_transactions')
export class CreditTransaction {
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
  credit_account_id!: string;

  @ManyToOne(() => CreditAccount, (account) => account.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'credit_account_id' })
  credit_account!: CreditAccount;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  invoice_id?: string | null;

  @ManyToOne(() => Invoice, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'invoice_id' })
  invoice?: Invoice | null;

  @Column({
    type: 'enum',
    enum: CreditTransactionType,
  })
  type!: CreditTransactionType;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
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

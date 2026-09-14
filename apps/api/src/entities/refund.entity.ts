import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Invoice } from './invoice.entity';
import { Payment } from './payment.entity';
import { User } from './user.entity';

@Entity('refunds')
export class Refund {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  invoice_id!: string;

  @ManyToOne(() => Invoice, (inv) => inv.refunds, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'invoice_id' })
  invoice!: Invoice;

  @Column({ type: 'uuid' })
  payment_id!: string;

  @ManyToOne(() => Payment, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'payment_id' })
  payment!: Payment;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  amount!: number;

  @Column({ type: 'text', nullable: true })
  reason?: string | null;

  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

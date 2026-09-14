import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { Branch } from './branch.entity';
import { Order } from './order.entity';
import { Customer } from './customer.entity';
import { User } from './user.entity';
import { Payment } from './payment.entity';
import { Refund } from './refund.entity';
import { InvoiceStatus } from '@chhiyapasal/shared-types';

@Entity('invoices')
export class Invoice {
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
  branch_id!: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid', unique: true })
  order_id!: string;

  @OneToOne(() => Order, (order) => order.invoice, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'varchar', length: 50 })
  invoice_number!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customer_id?: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paid_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  due_amount!: number;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.DRAFT,
  })
  status!: InvoiceStatus;

  @Column({ type: 'timestamptz', nullable: true })
  cancelled_at?: Date | null;

  @Column({ type: 'uuid', nullable: true })
  cancelled_by?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'cancelled_by' })
  canceller?: User | null;

  @Column({ type: 'text', nullable: true })
  cancel_reason?: string | null;

  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => Payment, (payment) => payment.invoice)
  payments!: Payment[];

  @OneToMany(() => Refund, (refund) => refund.invoice)
  refunds!: Refund[];
}

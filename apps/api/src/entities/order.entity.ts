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
import { Customer } from './customer.entity';
import { Table } from './table.entity';
import { User } from './user.entity';
import { OrderItem } from './order-item.entity';
import { OrderStatusHistory } from './order-status-history.entity';
import { Invoice } from './invoice.entity';
import { Kot } from './kot.entity';
import { OrderType, OrderStatus } from '@chhiyapasal/shared-types';

@Entity('orders')
export class Order {
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

  @Column({ type: 'varchar', length: 50 })
  order_number!: string;

  @Column({
    type: 'enum',
    enum: OrderType,
    default: OrderType.DINE_IN,
  })
  order_type!: OrderType;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  @Index()
  status!: OrderStatus;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  customer_id?: string | null;

  @ManyToOne(() => Customer, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer?: Customer | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  customer_name?: string | null;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  table_id?: string | null;

  @ManyToOne(() => Table, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'table_id' })
  table?: Table | null;

  @Column({ type: 'int', nullable: true })
  token_number?: number | null;

  @Column({ type: 'text', nullable: true })
  delivery_address?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  total_amount!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid' })
  created_by!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'created_by' })
  creator!: User;

  @Column({ type: 'uuid', nullable: true })
  updated_by?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  @Index()
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => OrderItem, (item) => item.order, { cascade: true })
  items!: OrderItem[];

  @OneToMany(() => OrderStatusHistory, (history) => history.order, { cascade: true })
  status_history!: OrderStatusHistory[];

  @OneToOne(() => Invoice, (invoice) => invoice.order)
  invoice?: Invoice;

  @OneToMany(() => Kot, (kot) => kot.order)
  kots!: Kot[];
}

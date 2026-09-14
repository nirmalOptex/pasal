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
import { Order } from './order.entity';
import { Product } from './product.entity';
import { OrderItemStatus } from '@chhiyapasal/shared-types';

@Entity('order_items')
export class OrderItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  order_id!: string;

  @ManyToOne(() => Order, (order) => order.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'uuid' })
  product_id!: string;

  @ManyToOne(() => Product, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'product_id' })
  product!: Product;

  @Column({ type: 'varchar', length: 255 })
  product_name!: string;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  product_price!: number;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unit_price!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  discount_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_price!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({
    type: 'enum',
    enum: OrderItemStatus,
    default: OrderItemStatus.PENDING,
  })
  status!: OrderItemStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

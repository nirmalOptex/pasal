import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Order } from './order.entity';
import { User } from './user.entity';

@Entity('order_status_history')
export class OrderStatusHistory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  order_id!: string;

  @ManyToOne(() => Order, (order) => order.status_history, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'varchar', length: 50, nullable: true })
  from_status?: string | null;

  @Column({ type: 'varchar', length: 50 })
  to_status!: string;

  @Column({ type: 'uuid', nullable: true })
  changed_by?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'changed_by' })
  user?: User | null;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

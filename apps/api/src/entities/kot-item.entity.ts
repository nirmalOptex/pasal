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
import { Kot } from './kot.entity';
import { OrderItem } from './order-item.entity';
import { KotStatus } from '@chhiyapasal/shared-types';

@Entity('kot_items')
export class KotItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  kot_id!: string;

  @ManyToOne(() => Kot, (kot) => kot.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'kot_id' })
  kot!: Kot;

  @Column({ type: 'uuid' })
  order_item_id!: string;

  @ManyToOne(() => OrderItem, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_item_id' })
  order_item!: OrderItem;

  @Column({ type: 'varchar', length: 255 })
  product_name!: string;

  @Column({ type: 'int' })
  quantity!: number;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({
    type: 'enum',
    enum: KotStatus,
    default: KotStatus.NEW,
  })
  status!: KotStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

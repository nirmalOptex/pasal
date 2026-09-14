import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Purchase } from './purchase.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('purchase_items')
export class PurchaseItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  purchase_id!: string;

  @ManyToOne(() => Purchase, (p) => p.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'purchase_id' })
  purchase!: Purchase;

  @Column({ type: 'uuid' })
  inventory_item_id!: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item!: InventoryItem;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  unit_cost!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_cost!: number;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

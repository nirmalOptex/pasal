import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { InventoryTransaction } from './inventory-transaction.entity';

@Entity('inventory_items')
export class InventoryItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  business_id!: string;

  @ManyToOne(() => Business, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'business_id' })
  business!: Business;

  @Column({ type: 'varchar', length: 255 })
  name!: string; // e.g. Milk, Tea leaves, Sugar, Flour

  @Column({ type: 'varchar', length: 50 })
  unit!: string; // e.g. ml, g, kg, ltr, pcs

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  current_stock!: number;

  @Column({ type: 'numeric', precision: 12, scale: 3, default: 0 })
  low_stock_threshold!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, nullable: true })
  cost_per_unit?: number | null;

  @Column({ type: 'boolean', default: true })
  is_active!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => InventoryTransaction, (t) => t.inventory_item)
  transactions!: InventoryTransaction[];
}

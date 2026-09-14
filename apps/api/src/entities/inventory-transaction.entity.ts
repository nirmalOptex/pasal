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
import { Branch } from './branch.entity';
import { InventoryItem } from './inventory-item.entity';
import { User } from './user.entity';
import { InventoryTransactionType } from '@chhiyapasal/shared-types';

@Entity('inventory_transactions')
export class InventoryTransaction {
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

  @Column({ type: 'uuid' })
  @Index()
  inventory_item_id!: string;

  @ManyToOne(() => InventoryItem, (item) => item.transactions, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item!: InventoryItem;

  @Column({
    type: 'enum',
    enum: InventoryTransactionType,
  })
  type!: InventoryTransactionType;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity!: number; // + for add/return, - for sale/wastage

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  balance_after!: number;

  @Column({ type: 'uuid', nullable: true })
  reference_id?: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  reference_type?: string | null; // 'order', 'purchase', etc.

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

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
import { Branch } from './branch.entity';
import { Supplier } from './supplier.entity';
import { User } from './user.entity';
import { PurchaseItem } from './purchase-item.entity';
import { PurchasePaymentStatus } from '@chhiyapasal/shared-types';

@Entity('purchases')
export class Purchase {
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
  supplier_id!: string;

  @ManyToOne(() => Supplier, (supplier) => supplier.purchases, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'supplier_id' })
  supplier!: Supplier;

  @Column({ type: 'date' })
  purchase_date!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  invoice_number?: string | null;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  subtotal!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  tax_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2 })
  total_amount!: number;

  @Column({ type: 'numeric', precision: 12, scale: 2, default: 0 })
  paid_amount!: number;

  @Column({
    type: 'enum',
    enum: PurchasePaymentStatus,
    default: PurchasePaymentStatus.UNPAID,
  })
  payment_status!: PurchasePaymentStatus;

  @Column({ type: 'text', nullable: true })
  notes?: string | null;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => PurchaseItem, (item) => item.purchase, { cascade: true })
  items!: PurchaseItem[];
}

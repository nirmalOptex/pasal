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
import { Branch } from './branch.entity';
import { Order } from './order.entity';
import { User } from './user.entity';
import { KotItem } from './kot-item.entity';
import { KotStatus } from '@chhiyapasal/shared-types';

@Entity('kots')
export class Kot {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  branch_id!: string;

  @ManyToOne(() => Branch, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ type: 'uuid' })
  @Index()
  order_id!: string;

  @ManyToOne(() => Order, (order) => order.kots, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'order_id' })
  order!: Order;

  @Column({ type: 'varchar', length: 50 })
  kot_number!: string;

  @Column({
    type: 'enum',
    enum: KotStatus,
    default: KotStatus.NEW,
  })
  status!: KotStatus;

  @Column({ type: 'uuid', nullable: true })
  created_by?: string | null;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'created_by' })
  creator?: User | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;

  @OneToMany(() => KotItem, (item) => item.kot, { cascade: true })
  items!: KotItem[];
}

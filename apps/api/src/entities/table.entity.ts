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
import { Branch } from './branch.entity';
import { TableArea } from './table-area.entity';
import { TableStatus } from '@chhiyapasal/shared-types';

@Entity('tables')
export class Table {
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
  table_area_id!: string;

  @ManyToOne(() => TableArea, (area) => area.tables, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'table_area_id' })
  area!: TableArea;

  @Column({ type: 'varchar', length: 50 })
  name!: string; // e.g. T1, T2

  @Column({ type: 'int', default: 4 })
  capacity!: number;

  @Column({
    type: 'enum',
    enum: TableStatus,
    default: TableStatus.AVAILABLE,
  })
  status!: TableStatus;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updated_at!: Date;
}

import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { Business } from './business.entity';
import { Expense } from './expense.entity';

@Entity('expense_categories')
export class ExpenseCategory {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid', nullable: true })
  @Index()
  business_id?: string | null;

  @ManyToOne(() => Business, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'business_id' })
  business?: Business | null;

  @Column({ type: 'varchar', length: 100 })
  name!: string; // Rent, Electricity, Salaries, Ingredients, Packaging, etc.

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;

  @OneToMany(() => Expense, (e) => e.category)
  expenses!: Expense[];
}

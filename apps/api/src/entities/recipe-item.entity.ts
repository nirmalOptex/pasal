import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Recipe } from './recipe.entity';
import { InventoryItem } from './inventory-item.entity';

@Entity('recipe_items')
export class RecipeItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  @Index()
  recipe_id!: string;

  @ManyToOne(() => Recipe, (recipe) => recipe.items, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'recipe_id' })
  recipe!: Recipe;

  @Column({ type: 'uuid' })
  inventory_item_id!: string;

  @ManyToOne(() => InventoryItem, { onDelete: 'RESTRICT' })
  @JoinColumn({ name: 'inventory_item_id' })
  inventory_item!: InventoryItem;

  @Column({ type: 'numeric', precision: 12, scale: 3 })
  quantity!: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  unit?: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  created_at!: Date;
}

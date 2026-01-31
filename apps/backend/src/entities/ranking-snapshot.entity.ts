import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

import { Product } from './product.entity';

@Entity('ranking_snapshots')
export class RankingSnapshot {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  @Column({ type: 'int' })
  rank: number;

  @Column({ type: 'text', default: 'ALL' })
  category: string;

  @Column({ type: 'decimal', precision: 12, scale: 0 })
  price: number;

  @Column({
    type: 'decimal',
    precision: 12,
    scale: 0,
    nullable: true,
    name: 'original_price',
  })
  originalPrice: number;

  @Column({ type: 'int', nullable: true, name: 'discount_rate' })
  discountRate: number;

  @Column({ type: 'decimal', precision: 3, scale: 1, nullable: true })
  rating: number;

  @Column({ type: 'int', nullable: true, name: 'review_count' })
  reviewCount: number;

  @Column({ type: 'timestamp with time zone', name: 'snapshot_at' })
  snapshotAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;
}

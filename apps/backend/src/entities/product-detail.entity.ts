import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
} from 'typeorm';

import { Product } from './product.entity';

@Entity('product_details')
export class ProductDetail {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => Product)
  @JoinColumn({ name: 'product_id' })
  product: Product;

  @Column({ type: 'uuid', name: 'product_id' })
  productId: string;

  /** 평점 (5점 만점, 예: 4.8) */
  @Column({ type: 'decimal', precision: 2, scale: 1, nullable: true })
  rating: number | null;

  /** 리뷰 수 */
  @Column({ type: 'int', nullable: true, name: 'review_count' })
  reviewCount: number | null;

  /** 용량 (예: "200ml") */
  @Column({ type: 'text', nullable: true })
  volume: string | null;

  /** 제조사 */
  @Column({ type: 'text', nullable: true })
  manufacturer: string | null;

  /** 크롤링 시각 */
  @Column({ type: 'timestamp with time zone', name: 'fetched_at' })
  fetchedAt: Date;

  @CreateDateColumn({ type: 'timestamp with time zone', name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'timestamp with time zone', name: 'updated_at' })
  updatedAt: Date;
}

import { z } from 'zod';

/**
 * 제품 상세 정보 스키마
 */
export const ProductDetailSchema = z.object({
  /** 상품 코드 */
  productCode: z.string(),
  /** 평점 (5점 만점, 예: 4.8) */
  rating: z.number().nullable(),
  /** 리뷰 수 */
  reviewCount: z.number().nullable(),
  /** 용량 (예: "200ml") */
  volume: z.string().nullable(),
  /** 제조사 */
  manufacturer: z.string().nullable(),
  /** 크롤링 시각 (ISO 8601) */
  fetchedAt: z.string(),
});
export type ProductDetail = z.infer<typeof ProductDetailSchema>;

/**
 * 제품 상세 정보 응답 스키마 (동기 모드)
 */
export const ProductDetailResponseSchema = z.object({
  success: z.boolean(),
  data: ProductDetailSchema.nullable(),
  message: z.string().optional(),
});
export type ProductDetailResponse = z.infer<typeof ProductDetailResponseSchema>;

/**
 * 비동기 크롤링 응답 스키마
 */
export const AsyncCrawlResponseSchema = z.object({
  success: z.boolean(),
  status: z.enum(['processing', 'completed', 'failed']),
  message: z.string(),
});
export type AsyncCrawlResponse = z.infer<typeof AsyncCrawlResponseSchema>;

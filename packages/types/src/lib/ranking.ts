import { z } from 'zod';

export const SERVICE_TYPES = ['oliveyoung'] as const; // 'coupang', 'amazon' 추가 예정
export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * 랭킹 상품 스키마 (프론트엔드/백엔드 공유)
 */
export const RankingItemSchema = z.object({
  rank: z.number(),
  productCode: z.string(),
  name: z.string(),
  brandName: z.string(),
  price: z.number(),
  originalPrice: z.number().nullable(),
  discountRate: z.number().nullable(),
  imageUrl: z.string(),
  productUrl: z.string(),
});
export type RankingItem = z.infer<typeof RankingItemSchema>;

/**
 * 최신 랭킹 응답 스키마
 */
export const LatestRankingSchema = z.object({
  snapshotAt: z.string().nullable(),
  rankings: z.array(RankingItemSchema),
});
export type LatestRanking = z.infer<typeof LatestRankingSchema>;

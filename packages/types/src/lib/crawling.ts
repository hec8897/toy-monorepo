import { z } from 'zod';

/**
 * 크롤링 원본 데이터 스키마
 * - 크롤러에서 수집한 원본 데이터
 * - rankChange, isNew 등 계산 필드 제외
 */
export const CrawledItemSchema = z.object({
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
export type CrawledItem = z.infer<typeof CrawledItemSchema>;

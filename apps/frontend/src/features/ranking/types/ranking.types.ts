import { z } from 'zod';

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

export const LatestRankingSchema = z.object({
  snapshotAt: z.string().nullable(),
  rankings: z.array(RankingItemSchema),
});
export type LatestRanking = z.infer<typeof LatestRankingSchema>;

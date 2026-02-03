import { z } from 'zod';

import { PaginationMetaSchema } from './common';
import { CrawledItemSchema } from './crawling';

/**
 * 랭킹 상품 스키마 (API 응답용)
 * - CrawledItem 확장 + 순위 변동 정보
 */
export const RankingItemSchema = CrawledItemSchema.extend({
  /** 순위 변동 (양수: 상승, 음수: 하락, 0: 변동없음, null: 비교 불가) */
  rankChange: z.number().nullable(),
  /** 신규 진입 여부 */
  isNew: z.boolean(),
});
export type RankingItem = z.infer<typeof RankingItemSchema>;

/**
 * 최신 랭킹 응답 스키마
 */
export const LatestRankingSchema = z.object({
  snapshotAt: z.string().nullable(),
  rankings: z.array(RankingItemSchema),
  pagination: PaginationMetaSchema,
});
export type LatestRanking = z.infer<typeof LatestRankingSchema>;

/**
 * 스냅샷 정보 스키마
 */
export const SnapshotInfoSchema = z.object({
  date: z.string(),
  snapshotAt: z.string(),
});
export type SnapshotInfo = z.infer<typeof SnapshotInfoSchema>;

/**
 * 스냅샷 목록 응답 스키마
 */
export const SnapshotListSchema = z.object({
  snapshots: z.array(SnapshotInfoSchema),
});
export type SnapshotList = z.infer<typeof SnapshotListSchema>;

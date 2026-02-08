import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 정렬 가능한 필드
 */
export const RankingSortFieldEnum = z.enum(['price', 'name', 'rankChange']);
export type RankingSortField = z.infer<typeof RankingSortFieldEnum>;

/**
 * 정렬 순서
 */
export const SortOrderEnum = z.enum(['ASC', 'DESC']);
export type SortOrder = z.infer<typeof SortOrderEnum>;

/**
 * 랭킹 조회 Query 파라미터 스키마
 */
export const GetRankingQuerySchema = z.object({
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortField: RankingSortFieldEnum.optional(),
  sortOrder: SortOrderEnum.optional(),
  brand: z.string().optional(),
});

export class GetRankingQueryDto extends createZodDto(GetRankingQuerySchema) {}

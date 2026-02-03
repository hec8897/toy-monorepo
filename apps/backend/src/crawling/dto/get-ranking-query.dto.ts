import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 랭킹 조회 Query 파라미터 스키마
 */
export const GetRankingQuerySchema = z.object({
  date: z.string().optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export class GetRankingQueryDto extends createZodDto(GetRankingQuerySchema) {}

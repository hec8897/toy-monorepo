import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 브랜드 목록 조회 Query 파라미터 스키마
 */
export const GetBrandsQuerySchema = z.object({
  date: z.string().optional(),
});

export class GetBrandsQueryDto extends createZodDto(GetBrandsQuerySchema) {}

import { createZodDto } from 'nestjs-zod';
import { z } from 'zod';

/**
 * 상세 크롤링 Query 파라미터 스키마
 */
export const ProductDetailQuerySchema = z.object({
  /** 비동기 모드 여부 (true: 백그라운드 실행, false: 동기 실행) */
  async: z
    .string()
    .optional()
    .default('false')
    .transform((val) => val === 'true'),
});

export class ProductDetailQueryDto extends createZodDto(
  ProductDetailQuerySchema,
) {}

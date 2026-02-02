import { z } from 'zod';

/**
 * 지원하는 서비스 타입
 */
export const SERVICE_TYPES = ['oliveyoung'] as const; // 'coupang', 'amazon' 추가 예정
export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * 페이지네이션 메타 정보 스키마
 */
export const PaginationMetaSchema = z.object({
  page: z.number(),
  limit: z.number(),
  total: z.number(),
  totalPages: z.number(),
});
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;

import type { ServiceType } from '@toy-monorepo/types';

/**
 * 중앙 Query Key 관리
 * - 일관된 키 네이밍
 * - 타입 안전성
 * - 캐시 무효화 용이
 */
export const queryKeys = {
  // 랭킹 관련
  ranking: {
    all: ['ranking'] as const,
    byService: (service: ServiceType) => ['ranking', service] as const,
  },

  // 인증 관련
  auth: {
    all: ['auth'] as const,
    user: () => ['auth', 'user'] as const,
  },

  // 추후 확장 예시
  // products: {
  //   all: ['products'] as const,
  //   list: (filters: ProductFilters) => ['products', 'list', filters] as const,
  //   detail: (id: string) => ['products', 'detail', id] as const,
  // },
} as const;

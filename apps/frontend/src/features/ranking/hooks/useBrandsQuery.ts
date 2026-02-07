'use client';

import { useQuery } from '@tanstack/react-query';

import { brandsQuery } from '../api/ranking.api';

import type { ServiceType } from '@toy-monorepo/types';

/**
 * 서비스별 브랜드 목록 조회 훅
 * @param service - 서비스 타입
 * @param date - 날짜 (optional, 미지정시 최신)
 */
export function useBrandsQuery(service: ServiceType, date?: string) {
  return useQuery({
    queryKey: brandsQuery.key(service, date),
    queryFn: () => brandsQuery.fetch(service, date),
  });
}

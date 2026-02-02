'use client';

import { useQuery } from '@tanstack/react-query';

import { queryKeys } from '@/shared/lib/queryKeys';

import { rankingApi } from '../api/ranking.api';

import type { ServiceType } from '@toy-monorepo/types';

/**
 * 서비스별 랭킹 데이터 조회 훅
 * @param service - 조회할 서비스 타입 (oliveyoung, coupang, amazon)
 */
export function useRankingQuery(service: ServiceType) {
  return useQuery({
    queryKey: queryKeys.ranking.byService(service),
    queryFn: () => rankingApi.getLatestRanking(service),
  });
}

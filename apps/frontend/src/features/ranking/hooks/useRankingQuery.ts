'use client';

import { useQuery } from '@tanstack/react-query';

import { rankingApi } from '../api/ranking.api';
import { ServiceType } from '../types/service.types';

/**
 * 서비스별 랭킹 쿼리 키 생성
 */
export const getRankingQueryKey = (service: ServiceType) => [
  'ranking',
  service,
];

/**
 * 서비스별 랭킹 데이터 조회 훅
 * @param service - 조회할 서비스 타입 (oliveyoung, coupang, amazon)
 */
export function useRankingQuery(service: ServiceType) {
  return useQuery({
    queryKey: getRankingQueryKey(service),
    queryFn: () => rankingApi.getLatestRanking(service),
  });
}

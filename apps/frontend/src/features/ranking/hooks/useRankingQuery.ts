'use client';

import { useQuery, keepPreviousData } from '@tanstack/react-query';

import { rankingQuery } from '../api/ranking.api';

import type { RankingQueryParams } from '../types/ranking.types';

/**
 * 서비스별 랭킹 데이터 조회 훅
 */
export function useRankingQuery(params: RankingQueryParams) {
  const {
    service,
    date,
    page = 1,
    limit = 20,
    sortField,
    sortOrder,
    brand,
  } = params;

  return useQuery({
    queryKey: rankingQuery.key(service, {
      date,
      page,
      limit,
      sortField,
      sortOrder,
      brand,
    }),
    queryFn: () =>
      rankingQuery.fetch({
        service,
        date,
        page,
        limit,
        sortField,
        sortOrder,
        brand,
      }),
    placeholderData: keepPreviousData,
  });
}

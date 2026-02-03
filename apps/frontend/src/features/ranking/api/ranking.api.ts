import { api } from '@/shared/lib/api';
import {
  LatestRankingSchema,
  LatestRanking,
  SnapshotListSchema,
  SnapshotList,
} from '@toy-monorepo/types';

import {
  SERVICE_ENDPOINTS,
  SERVICE_SNAPSHOT_ENDPOINTS,
} from '../types/service.types';

import type { RankingQueryParams } from '../types/ranking.types';
import type { ServiceType } from '@toy-monorepo/types';

/**
 * 랭킹 조회 (key + fetch 통합)
 */
export const rankingQuery = {
  key: (
    service: ServiceType,
    params: { date?: string; page?: number; limit?: number },
  ) => ['ranking', service, params] as const,

  fetch: async (params: RankingQueryParams): Promise<LatestRanking> => {
    const endpoint = SERVICE_ENDPOINTS[params.service];
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append('date', params.date);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));

    const response = await api.get(endpoint, {
      params: queryParams,
    });
    return LatestRankingSchema.parse(response.data);
  },
};

/**
 * 스냅샷 목록 조회 (key + fetch 통합)
 */
export const snapshotsQuery = {
  key: (service: ServiceType) => ['ranking', service, 'snapshots'] as const,

  fetch: async (service: ServiceType): Promise<SnapshotList> => {
    const endpoint = SERVICE_SNAPSHOT_ENDPOINTS[service];
    const response = await api.get(endpoint);
    return SnapshotListSchema.parse(response.data);
  },
};

import { api } from '@/shared/lib/api';
import {
  BrandList,
  BrandListSchema,
  LatestRankingSchema,
  LatestRanking,
  SnapshotListSchema,
  SnapshotList,
} from '@toy-monorepo/types';

import {
  SERVICE_BRANDS_ENDPOINTS,
  SERVICE_ENDPOINTS,
  SERVICE_SNAPSHOT_ENDPOINTS,
} from '../types/service.types';

import type {
  RankingQueryParams,
  RankingSortField,
  SortOrder,
} from '../types/ranking.types';
import type { ServiceType } from '@toy-monorepo/types';

/**
 * 랭킹 조회 (key + fetch 통합)
 */
export const rankingQuery = {
  key: (
    service: ServiceType,
    params: {
      date?: string;
      page?: number;
      limit?: number;
      sortField?: RankingSortField;
      sortOrder?: SortOrder;
      brand?: string;
    },
  ) => ['ranking', service, params] as const,

  fetch: async (params: RankingQueryParams): Promise<LatestRanking> => {
    const endpoint = SERVICE_ENDPOINTS[params.service];
    const queryParams = new URLSearchParams();

    if (params.date) queryParams.append('date', params.date);
    if (params.page) queryParams.append('page', String(params.page));
    if (params.limit) queryParams.append('limit', String(params.limit));
    if (params.sortField) queryParams.append('sortField', params.sortField);
    if (params.sortOrder) queryParams.append('sortOrder', params.sortOrder);
    if (params.brand) queryParams.append('brand', params.brand);

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

/**
 * 브랜드 목록 조회 (key + fetch 통합)
 */
export const brandsQuery = {
  key: (service: ServiceType, date?: string) =>
    ['ranking', service, 'brands', date] as const,

  fetch: async (service: ServiceType, date?: string): Promise<BrandList> => {
    const endpoint = SERVICE_BRANDS_ENDPOINTS[service];
    const queryParams = new URLSearchParams();

    if (date) queryParams.append('date', date);

    const response = await api.get(endpoint, {
      params: queryParams,
    });
    return BrandListSchema.parse(response.data);
  },
};

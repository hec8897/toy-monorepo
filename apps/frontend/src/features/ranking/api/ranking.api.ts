import { api } from '@/shared/lib/api';
import { LatestRankingSchema, LatestRanking } from '@toy-monorepo/types';

import { SERVICE_ENDPOINTS } from '../types/service.types';

import type { ServiceType } from '@toy-monorepo/types';

export const rankingApi = {
  /**
   * 서비스별 최신 랭킹 조회
   */
  getLatestRanking: async (service: ServiceType): Promise<LatestRanking> => {
    const endpoint = SERVICE_ENDPOINTS[service];
    const response = await api.get(endpoint);
    return LatestRankingSchema.parse(response.data);
  },
};

import { api } from '@/shared/lib/api';

import { LatestRanking, LatestRankingSchema } from '../types/ranking.types';
import { SERVICE_ENDPOINTS, ServiceType } from '../types/service.types';

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

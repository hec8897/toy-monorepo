import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/domains/dashboard/infrastructure/dashboardApi';

import { dashboardKeys } from './queryKeys';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useConceptGrowthQuery(days = 90) {
  return useQuery({
    queryKey: dashboardKeys.conceptGrowth(days),
    queryFn: () => dashboardApi.getConceptGrowth(days),
    staleTime: STALE_TIME_MS,
  });
}

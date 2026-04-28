import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/domains/dashboard/infrastructure/dashboardApi';

import { dashboardKeys } from './queryKeys';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useHeatmapQuery(days = 91) {
  return useQuery({
    queryKey: dashboardKeys.heatmap(days),
    queryFn: () => dashboardApi.getHeatmap(days),
    staleTime: STALE_TIME_MS,
  });
}

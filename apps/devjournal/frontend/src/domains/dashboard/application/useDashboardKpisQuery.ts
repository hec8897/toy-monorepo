import { useQuery } from '@tanstack/react-query';

import { dashboardApi } from '@/domains/dashboard/infrastructure/dashboardApi';

import { dashboardKeys } from './queryKeys';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useDashboardKpisQuery() {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: dashboardApi.getKpis,
    staleTime: STALE_TIME_MS,
  });
}

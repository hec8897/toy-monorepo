import { useQuery } from '@tanstack/react-query';

import { mindmapApi } from '@/domains/mindmap/infrastructure/mindmapApi';

import { mindmapQueryKeys } from './queryKeys';

const STALE_TIME_MS = 5 * 60 * 1000;

export function useMindmapQuery() {
  return useQuery({
    queryKey: mindmapQueryKeys.graph(),
    queryFn: mindmapApi.getMyMindmap,
    staleTime: STALE_TIME_MS,
  });
}

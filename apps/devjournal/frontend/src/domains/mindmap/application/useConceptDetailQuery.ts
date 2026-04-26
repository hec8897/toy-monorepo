import { useQuery } from '@tanstack/react-query';

import { mindmapApi } from '@/domains/mindmap/infrastructure/mindmapApi';

import { mindmapQueryKeys } from './queryKeys';

const STALE_TIME_MS = 60_000;

export function useConceptDetailQuery(conceptId: string | null) {
  return useQuery({
    queryKey: mindmapQueryKeys.conceptDetail(conceptId ?? ''),
    queryFn: () => mindmapApi.getConceptDetail(conceptId as string),
    enabled: !!conceptId,
    staleTime: STALE_TIME_MS,
  });
}

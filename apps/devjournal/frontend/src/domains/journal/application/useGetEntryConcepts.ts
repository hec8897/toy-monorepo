import { useQuery } from '@tanstack/react-query';

import type { AnalysisStatus } from '@devjournal/types';

import { journalQueryKeys } from '@/domains/journal/application/queryKeys';
import { journalApi } from '@/domains/journal/infrastructure/journalApi';

export function useGetEntryConcepts(
  id: string,
  analysisStatus: AnalysisStatus | undefined,
) {
  return useQuery({
    queryKey: journalQueryKeys.concepts(id),
    queryFn: () => journalApi.getEntryConcepts(id),
    enabled: !!id,
    // 분석이 완료되거나 실패하면 polling 중단
    refetchInterval:
      analysisStatus === 'completed' || analysisStatus === 'failed'
        ? false
        : 3000,
  });
}

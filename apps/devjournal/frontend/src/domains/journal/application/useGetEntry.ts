import { useQuery } from '@tanstack/react-query';

import { journalQueryKeys } from '@/domains/journal/application/queryKeys';
import { journalApi } from '@/domains/journal/infrastructure/journalApi';

export function useGetEntry(id: string) {
  return useQuery({
    queryKey: journalQueryKeys.detail(id),
    queryFn: () => journalApi.getEntry(id),
    enabled: !!id,
  });
}

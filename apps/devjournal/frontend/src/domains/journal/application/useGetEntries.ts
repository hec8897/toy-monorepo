import { useQuery } from '@tanstack/react-query';

import { journalQueryKeys } from '@/domains/journal/application/queryKeys';
import { journalApi } from '@/domains/journal/infrastructure/journalApi';

export function useGetEntries() {
  return useQuery({
    queryKey: journalQueryKeys.entries(),
    queryFn: journalApi.getEntries,
  });
}

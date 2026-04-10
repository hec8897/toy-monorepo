import { useQuery } from '@tanstack/react-query';

import { conceptQueryKeys } from '@/domains/concepts/application/queryKeys';
import { conceptApi } from '@/domains/concepts/infrastructure/conceptApi';

export function useSearchConcepts(q: string) {
  return useQuery({
    queryKey: conceptQueryKeys.search(q),
    queryFn: () => conceptApi.searchConcepts(q),
    enabled: q.length > 0,
  });
}

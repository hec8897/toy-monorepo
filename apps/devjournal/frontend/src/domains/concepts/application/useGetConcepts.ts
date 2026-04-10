import { useQuery } from '@tanstack/react-query';

import { conceptQueryKeys } from '@/domains/concepts/application/queryKeys';
import { conceptApi } from '@/domains/concepts/infrastructure/conceptApi';

export function useGetConcepts(limit?: number, offset?: number) {
  return useQuery({
    queryKey: conceptQueryKeys.lists(),
    queryFn: () => conceptApi.getConcepts(limit, offset),
  });
}

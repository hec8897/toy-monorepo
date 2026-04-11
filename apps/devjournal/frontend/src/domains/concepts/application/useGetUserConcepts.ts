import { useQuery } from '@tanstack/react-query';

import { conceptQueryKeys } from '@/domains/concepts/application/queryKeys';
import { conceptApi } from '@/domains/concepts/infrastructure/conceptApi';

export function useGetUserConcepts() {
  return useQuery({
    queryKey: conceptQueryKeys.user(),
    queryFn: conceptApi.getUserConcepts,
  });
}

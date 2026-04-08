import { useQuery } from '@tanstack/react-query';

import { journalApi } from '../api';

export const ENTRIES_QUERY_KEY = ['entries'] as const;

export function useEntries() {
  return useQuery({
    queryKey: ENTRIES_QUERY_KEY,
    queryFn: journalApi.getEntries,
  });
}

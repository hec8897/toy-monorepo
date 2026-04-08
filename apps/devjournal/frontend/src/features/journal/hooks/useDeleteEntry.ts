import { useMutation, useQueryClient } from '@tanstack/react-query';

import { journalApi } from '../api';
import { ENTRIES_QUERY_KEY } from './useEntries';

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalApi.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ENTRIES_QUERY_KEY });
    },
  });
}

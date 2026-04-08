import { useMutation, useQueryClient } from '@tanstack/react-query';

import { journalQueryKeys } from '@/domains/journal/application/queryKeys';
import { journalApi } from '@/domains/journal/infrastructure/journalApi';

export function useDeleteEntry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: journalApi.deleteEntry,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: journalQueryKeys.entries() });
    },
  });
}

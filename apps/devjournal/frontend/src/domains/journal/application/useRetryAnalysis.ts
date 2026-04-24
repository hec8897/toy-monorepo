'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';

import { journalApi } from '@/domains/journal/infrastructure/journalApi';

import { journalQueryKeys } from './queryKeys';

export function useRetryAnalysis(entryId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => journalApi.retryAnalysis(entryId),
    onSuccess: () => {
      void queryClient.invalidateQueries({
        queryKey: journalQueryKeys.detail(entryId),
      });
    },
  });
}

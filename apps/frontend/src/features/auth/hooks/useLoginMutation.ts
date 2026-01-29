'use client';

import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';

import { authApi } from '@/shared/lib/api';
import { useAuthStore } from '@/shared/stores/authStore';

interface UseLoginMutationOptions {
  onError?: (error: Error) => void;
}

export function useLoginMutation(options?: UseLoginMutationOptions) {
  const router = useRouter();
  const setUser = useAuthStore((state) => state.setUser);

  return useMutation({
    mutationFn: authApi.login,
    onSuccess: (data) => {
      setUser(data.user);
      router.push('/');
    },
    onError: options?.onError,
  });
}

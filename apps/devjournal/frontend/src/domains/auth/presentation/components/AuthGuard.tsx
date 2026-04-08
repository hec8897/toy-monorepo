'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { useAuthStore } from '@/domains/auth/infrastructure/authStore';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized && session === null) {
      router.replace('/login');
    }
  }, [initialized, session, router]);

  if (!initialized) return null;

  return <>{children}</>;
}

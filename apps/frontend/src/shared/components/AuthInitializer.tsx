'use client';

import { useEffect } from 'react';
import { useAuthStore } from '../stores/authStore';

interface AuthInitializerProps {
  children: React.ReactNode;
}

/**
 * 페이지 진입 시 사용자 정보를 요청함 (실패해도 로그인 페이지로 리다이렉트하지 않음)
 * 리다이렉트는 AuthGuard 컴포넌트에서 처리함
 * @returns
 */

export function AuthInitializer({ children }: AuthInitializerProps) {
  const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

  useEffect(() => {
    fetchCurrentUser();
  }, [fetchCurrentUser]);

  return <>{children}</>;
}

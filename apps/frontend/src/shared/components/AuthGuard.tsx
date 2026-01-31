'use client';

import { useEffect } from 'react';

import { useRouter } from 'next/navigation';

import { Spin } from 'antd';

import { useAuthStore } from '../stores/authStore';

interface AuthGuardProps {
  children: React.ReactNode;
}

/**
 * 인증된 사용자만 접근 가능한 페이지를 보호하는 컴포넌트
 * 인증되지 않은 사용자가 접근하려고 할 경우 로그인 페이지로 리다이렉트
 * @returns
 */

export function AuthGuard({ children }: AuthGuardProps) {
  const router = useRouter();
  const { isAuthenticated, isLoading } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
}

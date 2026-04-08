'use client';

import { useEffect } from 'react';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

import { useAuthStore } from '@/shared/stores/authStore';

const NAV_ITEMS = [
  { href: '/journal', label: '일기 작성', icon: '✏️' },
  { href: '/mindmap', label: '마인드맵', icon: '🕸️' },
  { href: '/dashboard', label: '대시보드', icon: '📊' },
];

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const session = useAuthStore((s) => s.session);
  const initialized = useAuthStore((s) => s.initialized);

  useEffect(() => {
    if (initialized && session === null) {
      router.replace('/login');
    }
  }, [initialized, session, router]);

  if (!initialized) return null;

  return (
    <div className="flex h-dvh bg-gray-50">
      {/* 데스크탑 사이드바 */}
      <aside className="hidden w-56 shrink-0 flex-col border-r border-gray-200 bg-white px-4 py-6 md:flex">
        <p className="mb-6 text-lg font-bold text-gray-900">DevJournal</p>
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                pathname === href
                  ? 'bg-gray-100 text-gray-900'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
              }`}
            >
              <span>{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </aside>

      {/* 모바일 + 데스크탑 본문 영역 */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* 모바일 헤더 */}
        <header className="flex items-center border-b border-gray-200 bg-white px-4 py-3 md:hidden">
          <p className="text-base font-bold text-gray-900">DevJournal</p>
        </header>

        {/* 페이지 콘텐츠 */}
        <main className="flex-1 overflow-auto pb-16 md:pb-0">{children}</main>

        {/* 모바일 하단 탭 바 */}
        <nav className="fixed bottom-0 left-0 right-0 flex border-t border-gray-200 bg-white md:hidden">
          {NAV_ITEMS.map(({ href, label, icon }) => (
            <Link
              key={href}
              href={href}
              className={`flex flex-1 flex-col items-center gap-0.5 py-2 text-xs font-medium transition-colors ${
                pathname === href ? 'text-gray-900' : 'text-gray-400'
              }`}
            >
              <span className="text-lg">{icon}</span>
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}

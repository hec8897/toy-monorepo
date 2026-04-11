import './global.css';
import { QueryProvider } from '@/shared/providers/QueryProvider';
import { SupabaseProvider } from '@/shared/providers/SupabaseProvider';

export const metadata = {
  title: 'DevJournal',
  description: '개발 일기로 성장을 추적하세요',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>
        <QueryProvider>
          <SupabaseProvider>{children}</SupabaseProvider>
        </QueryProvider>
      </body>
    </html>
  );
}

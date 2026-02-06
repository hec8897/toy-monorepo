import './global.css';

import { AntdRegistry } from '@ant-design/nextjs-registry';
import { NuqsAdapter } from 'nuqs/adapters/next/app';

import { AuthInitializer } from '@/shared/components/AuthInitializer';
import { QueryProvider } from '@/shared/providers/QueryProvider';

export const metadata = {
  title: 'Toy Monorepo Frontend',
  description: 'Frontend for toy-monorepo project',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>
          <NuqsAdapter>
            <AuthInitializer>
              <AntdRegistry>{children}</AntdRegistry>
            </AuthInitializer>
          </NuqsAdapter>
        </QueryProvider>
      </body>
    </html>
  );
}

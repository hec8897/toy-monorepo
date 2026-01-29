import './global.css';

import { AntdRegistry } from '@ant-design/nextjs-registry';

import { QueryProvider } from '@/shared/providers/QueryProvider';
import { AuthInitializer } from '@/shared/components/AuthInitializer';

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
          <AuthInitializer>
            <AntdRegistry>{children}</AntdRegistry>
          </AuthInitializer>
        </QueryProvider>
      </body>
    </html>
  );
}

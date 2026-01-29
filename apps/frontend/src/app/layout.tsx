import './global.css';

import { AntdRegistry } from '@ant-design/nextjs-registry';

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
          <AntdRegistry>{children}</AntdRegistry>
        </QueryProvider>
      </body>
    </html>
  );
}

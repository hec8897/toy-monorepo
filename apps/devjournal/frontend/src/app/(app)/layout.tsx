import { AppLayout } from '@/domains/auth/presentation/components/AppLayout';
import { AuthGuard } from '@/domains/auth/presentation/components/AuthGuard';

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppLayout>{children}</AppLayout>
    </AuthGuard>
  );
}

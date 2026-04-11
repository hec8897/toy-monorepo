import { LoginErrorPageView } from '@/domains/auth/presentation/components/LoginErrorPageView';

interface Props {
  searchParams: Promise<{ reason?: string }>;
}

export default async function LoginErrorPage({ searchParams }: Props) {
  const { reason } = await searchParams;
  return <LoginErrorPageView reason={reason} />;
}

import { redirect } from 'next/navigation';

import { ROUTES } from '@/shared/config/navigation';

export default function Home() {
  redirect(ROUTES.DASHBOARD.OLIVEYOUNG);
}

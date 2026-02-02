'use client';

import { Typography } from 'antd';

import { RankingTable } from '@/features/ranking';
import { AuthGuard } from '@/shared/components/AuthGuard';

const { Title } = Typography;

export default function OliveyoungPage() {
  return (
    <AuthGuard>
      <div className="max-w-7xl mx-auto my-10">
        <Title level={2}>올리브영 베스트 랭킹</Title>
        <RankingTable service="oliveyoung" />
      </div>
    </AuthGuard>
  );
}

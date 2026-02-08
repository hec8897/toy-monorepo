'use client';

import { Typography } from 'antd';

import { RankingTable } from '@/features/ranking';

const { Title } = Typography;

export default function OliveyoungPage() {
  return (
    <div>
      <Title level={2}>올리브영 베스트 랭킹</Title>
      <RankingTable service="oliveyoung" />
    </div>
  );
}

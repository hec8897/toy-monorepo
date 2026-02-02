'use client';

import { Alert } from 'antd';

import { RankingTableView } from './RankingTableView';
import { useRankingQuery } from '../hooks/useRankingQuery';
import { SERVICE_LABELS } from '../types/service.types';

import type { ServiceType } from '@toy-monorepo/types';

interface RankingTableProps {
  service: ServiceType;
}

export function RankingTable({ service }: RankingTableProps) {
  const { data, isLoading, error } = useRankingQuery(service);

  if (error) {
    return (
      <Alert
        type="error"
        title={`${SERVICE_LABELS[service]} 데이터를 불러오는데 실패했습니다.`}
      />
    );
  }

  return (
    <RankingTableView
      rankings={data?.rankings ?? []}
      snapshotAt={data?.snapshotAt ?? null}
      loading={isLoading}
    />
  );
}

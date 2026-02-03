'use client';

import { useState } from 'react';

import { Alert, Typography } from 'antd';

import {
  RankingFilterBar,
  RankingTableView,
  useRankingQuery,
  useSnapshotsQuery,
  SERVICE_LABELS,
} from '@/features/ranking';

import type { ServiceType } from '@toy-monorepo/types';

const { Text } = Typography;

interface RankingTableProps {
  service: ServiceType;
}

const DEFAULT_PAGINATION = {
  page: 1,
  limit: 20,
  total: 0,
  totalPages: 0,
};

export function RankingTable({ service }: RankingTableProps) {
  const [selectedDate, setSelectedDate] = useState<string | undefined>();
  const [page, setPage] = useState(1);

  const { data: snapshotsData, isLoading: snapshotsLoading } =
    useSnapshotsQuery(service);

  const { data, isLoading, error } = useRankingQuery({
    service,
    date: selectedDate,
    page,
  });

  const handleDateChange = (date: string | undefined) => {
    setSelectedDate(date);
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  if (error) {
    return (
      <Alert
        type="error"
        title={`${SERVICE_LABELS[service]} 데이터를 불러오는데 실패했습니다.`}
      />
    );
  }

  return (
    <div>
      <RankingFilterBar
        snapshots={snapshotsData?.snapshots ?? []}
        selectedDate={selectedDate}
        onDateChange={handleDateChange}
        loading={snapshotsLoading}
      />
      <div>
        {data?.snapshotAt && (
          <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
            기준 시각: {new Date(data?.snapshotAt).toLocaleString('ko-KR')}
          </Text>
        )}
        <RankingTableView
          rankings={data?.rankings ?? []}
          loading={isLoading}
          pagination={data?.pagination ?? DEFAULT_PAGINATION}
          onPageChange={handlePageChange}
        />
      </div>
    </div>
  );
}

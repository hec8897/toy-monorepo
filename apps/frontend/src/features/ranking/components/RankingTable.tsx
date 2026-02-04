'use client';

import { Alert, Typography } from 'antd';

import {
  RankingFilterBar,
  RankingTableView,
  useRankingQuery,
  useSnapshotsQuery,
  SERVICE_LABELS,
} from '@/features/ranking';
import { DEFAULT_PAGINATION } from '@toy-monorepo/types';

import { useRankingFilters } from '../hooks/useRankingFilters';

import type { RankingSort } from '../types/ranking.types';
import type { ServiceType } from '@toy-monorepo/types';

const { Text } = Typography;

interface RankingTableProps {
  service: ServiceType;
}

export function RankingTable({ service }: RankingTableProps) {
  const {
    date,
    page,
    sortField,
    sortOrder,
    setPage,
    handleDateChange,
    handleSortChange,
  } = useRankingFilters();

  const { data: snapshotsData, isLoading: snapshotsLoading } =
    useSnapshotsQuery(service);

  const { data, isLoading, error } = useRankingQuery({
    service,
    date: date ?? undefined,
    page,
    sortField: sortField ?? undefined,
    sortOrder: sortOrder ?? undefined,
  });

  // RankingTableView용 어댑터
  const sort: RankingSort | undefined =
    sortField && sortOrder ? { field: sortField, order: sortOrder } : undefined;

  const onSortChange = (newSort: RankingSort | undefined) => {
    handleSortChange(newSort?.field, newSort?.order);
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
        selectedDate={date ?? undefined}
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
          onPageChange={setPage}
          sort={sort}
          onSortChange={onSortChange}
        />
      </div>
    </div>
  );
}

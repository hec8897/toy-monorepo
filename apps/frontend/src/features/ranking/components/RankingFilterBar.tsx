'use client';

import { useMemo } from 'react';

import { Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';

import type { SnapshotInfo } from '@toy-monorepo/types';

const { Text } = Typography;

interface RankingFilterBarProps {
  snapshots: SnapshotInfo[];
  selectedDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
  loading?: boolean;
}

export function RankingFilterBar({
  snapshots,
  selectedDate,
  onDateChange,
  loading,
}: RankingFilterBarProps) {
  const options = useMemo(
    () => [
      { label: '최신', value: '' },
      ...snapshots.map((snapshot) => ({
        label: dayjs(snapshot.snapshotAt).format('YYYY-MM-DD'),
        value: snapshot.date,
      })),
    ],
    [snapshots],
  );

  return (
    <Space align="center" style={{ marginBottom: 16 }}>
      <Text>기준 날짜:</Text>
      <Select
        value={selectedDate ?? ''}
        onChange={(value) => onDateChange(value || undefined)}
        options={options}
        loading={loading}
        style={{ width: 180 }}
        placeholder="날짜 선택"
      />
    </Space>
  );
}

'use client';

import { useMemo } from 'react';

import { Button, Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';

import { useBrandsQuery } from '../hooks/useBrandsQuery';
import { useRankingFilters } from '../hooks/useRankingFilters';
import { useSnapshotsQuery } from '../hooks/useSnapshotsQuery';

import type { ServiceType } from '@toy-monorepo/types';

const { Text } = Typography;

interface RankingFilterBarProps {
  service: ServiceType;
}

export function RankingFilterBar({ service }: RankingFilterBarProps) {
  const { date, brand, handleDateChange, handleBrandChange, handleReset } =
    useRankingFilters();

  const { data: snapshotsData, isLoading: snapshotsLoading } =
    useSnapshotsQuery(service);

  const { data: brandsData, isLoading: brandsLoading } = useBrandsQuery(
    service,
    date ?? undefined,
  );

  const dateOptions = useMemo(
    () => [
      { label: '최신', value: '' },
      ...(snapshotsData?.snapshots ?? []).map((snapshot) => ({
        label: dayjs(snapshot.snapshotAt).format('YYYY-MM-DD'),
        value: snapshot.date,
      })),
    ],
    [snapshotsData?.snapshots],
  );

  const brandOptions = useMemo(
    () => [
      { label: '전체 브랜드', value: '' },
      ...(brandsData?.brands ?? []).map((b) => ({
        label: `${b.brandName} (${b.productCount})`,
        value: b.brandName,
      })),
    ],
    [brandsData?.brands],
  );

  const hasActiveFilters = date || brand;

  return (
    <Space align="center" style={{ marginBottom: 16 }} wrap>
      <Text>기준 날짜:</Text>
      <Select
        value={date ?? ''}
        onChange={(value) => handleDateChange(value || undefined)}
        options={dateOptions}
        loading={snapshotsLoading}
        style={{ width: 180 }}
        placeholder="날짜 선택"
      />
      <Text>브랜드:</Text>
      <Select
        value={brand ?? ''}
        onChange={(value) => handleBrandChange(value || undefined)}
        options={brandOptions}
        loading={brandsLoading}
        style={{ width: 220 }}
        placeholder="브랜드 선택"
        showSearch
      />
      {hasActiveFilters && (
        <Button type="link" onClick={handleReset}>
          초기화
        </Button>
      )}
    </Space>
  );
}

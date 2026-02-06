'use client';

import { useMemo } from 'react';

import { Select, Space, Typography } from 'antd';
import dayjs from 'dayjs';

import type { BrandOption, SnapshotInfo } from '@toy-monorepo/types';

const { Text } = Typography;

interface RankingFilterBarProps {
  snapshots: SnapshotInfo[];
  selectedDate: string | undefined;
  onDateChange: (date: string | undefined) => void;
  loading?: boolean;
  brands?: BrandOption[];
  selectedBrand?: string;
  onBrandChange?: (brand: string | undefined) => void;
  brandsLoading?: boolean;
}

export function RankingFilterBar({
  snapshots,
  selectedDate,
  onDateChange,
  loading,
  brands = [],
  selectedBrand,
  onBrandChange,
  brandsLoading,
}: RankingFilterBarProps) {
  const dateOptions = useMemo(
    () => [
      { label: '최신', value: '' },
      ...snapshots.map((snapshot) => ({
        label: dayjs(snapshot.snapshotAt).format('YYYY-MM-DD'),
        value: snapshot.date,
      })),
    ],
    [snapshots],
  );

  const brandOptions = useMemo(
    () => [
      { label: '전체 브랜드', value: '' },
      ...brands.map((brand) => ({
        label: `${brand.brandName} (${brand.productCount})`,
        value: brand.brandName,
      })),
    ],
    [brands],
  );

  return (
    <Space align="center" style={{ marginBottom: 16 }} wrap>
      <Text>기준 날짜:</Text>
      <Select
        value={selectedDate ?? ''}
        onChange={(value) => onDateChange(value || undefined)}
        options={dateOptions}
        loading={loading}
        style={{ width: 180 }}
        placeholder="날짜 선택"
      />
      <Text>브랜드:</Text>
      <Select
        value={selectedBrand ?? ''}
        onChange={(value) => onBrandChange?.(value || undefined)}
        options={brandOptions}
        loading={brandsLoading}
        style={{ width: 220 }}
        placeholder="브랜드 선택"
        showSearch
      />
    </Space>
  );
}

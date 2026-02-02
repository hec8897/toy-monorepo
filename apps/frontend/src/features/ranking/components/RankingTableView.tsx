'use client';

import { Table, Typography } from 'antd';

import type { RankingItem } from '@toy-monorepo/types';
import type { ColumnsType } from 'antd/es/table';

const { Text, Link } = Typography;

interface RankingTableViewProps {
  rankings: RankingItem[];
  snapshotAt: string | null;
  loading: boolean;
}

const columns: ColumnsType<RankingItem> = [
  {
    title: '순위',
    dataIndex: 'rank',
    key: 'rank',
    width: 70,
    align: 'center',
  },
  {
    title: '브랜드',
    dataIndex: 'brandName',
    key: 'brandName',
    width: 120,
  },
  {
    title: '상품명',
    dataIndex: 'name',
    key: 'name',
    render: (name: string, record: RankingItem) => (
      <Link href={record.productUrl} target="_blank">
        {name}
      </Link>
    ),
  },
  {
    title: '가격',
    dataIndex: 'price',
    key: 'price',
    width: 100,
    render: (price: number) => `${price.toLocaleString()}원`,
  },
  {
    title: '할인율',
    dataIndex: 'discountRate',
    key: 'discountRate',
    width: 80,
    align: 'center',
    render: (rate: number | null) => (rate ? `${rate}%` : '-'),
  },
];

export function RankingTableView({
  rankings,
  snapshotAt,
  loading,
}: RankingTableViewProps) {
  return (
    <div>
      {snapshotAt && (
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          기준 시각: {new Date(snapshotAt).toLocaleString('ko-KR')}
        </Text>
      )}
      <Table
        columns={columns}
        dataSource={rankings}
        rowKey="productCode"
        loading={loading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}

'use client';

import { Table, Typography } from 'antd';

import { RankChangeBadge } from '@/features/ranking';

import type { RankingItem, PaginationMeta } from '@toy-monorepo/types';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

const { Link } = Typography;

interface RankingTableViewProps {
  rankings: RankingItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
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
    title: '변동',
    key: 'rankChange',
    width: 80,
    align: 'center',
    render: (_, record: RankingItem) => (
      <RankChangeBadge rankChange={record.rankChange} isNew={record.isNew} />
    ),
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
  loading,
  pagination,
  onPageChange,
}: RankingTableViewProps) {
  const tablePagination: TablePaginationConfig = {
    current: pagination.page,
    pageSize: pagination.limit,
    total: pagination.total,
    showSizeChanger: false,
    showTotal: (total) => `총 ${total}개`,
    onChange: onPageChange,
  };

  return (
    <Table
      columns={columns}
      dataSource={rankings}
      rowKey="productCode"
      loading={loading}
      pagination={tablePagination}
    />
  );
}

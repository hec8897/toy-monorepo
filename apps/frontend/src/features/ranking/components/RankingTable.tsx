'use client';

import { Alert, Table, Typography } from 'antd';

import { useRankingQuery } from '../hooks/useRankingQuery';
import { RankingItem } from '../types/ranking.types';
import { SERVICE_LABELS, ServiceType } from '../types/service.types';

import type { ColumnsType } from 'antd/es/table';

const { Text, Link } = Typography;

interface RankingTableProps {
  service: ServiceType;
}

export function RankingTable({ service }: RankingTableProps) {
  const { data, isLoading, error } = useRankingQuery(service);

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

  if (error) {
    return (
      <Alert
        type="error"
        message={`${SERVICE_LABELS[service]} 데이터를 불러오는데 실패했습니다.`}
      />
    );
  }

  return (
    <div>
      {data?.snapshotAt && (
        <Text type="secondary" style={{ marginBottom: 16, display: 'block' }}>
          기준 시각: {new Date(data.snapshotAt).toLocaleString('ko-KR')}
        </Text>
      )}
      <Table
        columns={columns}
        dataSource={data?.rankings}
        rowKey="productCode"
        loading={isLoading}
        pagination={{ pageSize: 20 }}
      />
    </div>
  );
}

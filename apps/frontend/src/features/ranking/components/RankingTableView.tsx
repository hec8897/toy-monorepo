'use client';

import { Table, Typography } from 'antd';

import { RankChangeBadge } from '@/features/ranking';

import { antdToApiSortOrder, apiToAntdSortOrder } from '../types/ranking.types';

import type { RankingSort, RankingSortField } from '../types/ranking.types';
import type { RankingItem, PaginationMeta } from '@toy-monorepo/types';
import type { TableProps } from 'antd';
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table';

const { Link } = Typography;

interface RankingTableViewProps {
  rankings: RankingItem[];
  loading: boolean;
  pagination: PaginationMeta;
  onPageChange: (page: number) => void;
  sort?: RankingSort;
  onSortChange: (sort: RankingSort | undefined) => void;
}

const SORTABLE_COLUMNS: RankingSortField[] = ['price', 'name', 'rankChange'];

function createColumns(currentSort?: RankingSort): ColumnsType<RankingItem> {
  return [
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
      sorter: true,
      sortOrder:
        currentSort?.field === 'rankChange'
          ? apiToAntdSortOrder(currentSort.order)
          : null,
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
      sorter: true,
      sortOrder:
        currentSort?.field === 'name'
          ? apiToAntdSortOrder(currentSort.order)
          : null,
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
      sorter: true,
      sortOrder:
        currentSort?.field === 'price'
          ? apiToAntdSortOrder(currentSort.order)
          : null,
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
}

export function RankingTableView({
  rankings,
  loading,
  pagination,
  onPageChange,
  sort,
  onSortChange,
}: RankingTableViewProps) {
  const tablePagination: TablePaginationConfig = {
    current: pagination.page,
    pageSize: pagination.limit,
    total: pagination.total,
    showSizeChanger: false,
    showTotal: (total) => `총 ${total}개`,
  };

  const handleTableChange: TableProps<RankingItem>['onChange'] = (
    paginationConfig,
    _filters,
    sorter,
  ) => {
    // 페이지 변경 처리
    if (
      paginationConfig.current &&
      paginationConfig.current !== pagination.page
    ) {
      onPageChange(paginationConfig.current);
      return;
    }

    // 정렬 변경 처리
    const singleSorter = Array.isArray(sorter) ? sorter[0] : sorter;

    if (!singleSorter || !singleSorter.order) {
      onSortChange(undefined);
      return;
    }

    const field = singleSorter.columnKey as string;
    if (!SORTABLE_COLUMNS.includes(field as RankingSortField)) {
      return;
    }

    const order = antdToApiSortOrder(singleSorter.order);
    if (order) {
      onSortChange({ field: field as RankingSortField, order });
    }
  };

  const columns = createColumns(sort);

  return (
    <Table
      columns={columns}
      dataSource={rankings}
      rowKey="productCode"
      loading={loading}
      pagination={tablePagination}
      onChange={handleTableChange}
    />
  );
}

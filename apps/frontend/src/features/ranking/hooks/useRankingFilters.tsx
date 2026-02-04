import { useQueryState, parseAsInteger, parseAsStringEnum } from 'nuqs';

import { RankingSortField, SortOrder } from '../types/ranking.types';

const sortFields: RankingSortField[] = ['price', 'name', 'rankChange'];
const sortOrders: SortOrder[] = ['ASC', 'DESC'];

export function useRankingFilters() {
  const [date, setDate] = useQueryState('date');
  const [page, setPage] = useQueryState('page', parseAsInteger.withDefault(1));
  const [sortField, setSortField] = useQueryState<RankingSortField>(
    'sortField',
    parseAsStringEnum(sortFields),
  );

  const [sortOrder, setSortOrder] = useQueryState<SortOrder>(
    'sortOrder',
    parseAsStringEnum(sortOrders),
  );

  const handleDateChange = (date: string | undefined) => {
    setDate(date ?? null);
    setPage(1);
  };

  const handleSortChange = (field?: string, order?: string) => {
    setSortField(field as RankingSortField | null);
    setSortOrder(order as SortOrder | null);
    setPage(1);
  };
  return {
    date,
    page,
    sortField,
    sortOrder,
    setPage,
    handleDateChange,
    handleSortChange,
  };
}

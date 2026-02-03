import type { ServiceType } from '@toy-monorepo/types';
import type { SortOrder as AntdSortOrder } from 'antd/es/table/interface';

/**
 * 정렬 가능한 필드
 */
export type RankingSortField = 'price' | 'name' | 'rankChange';

/**
 * API 정렬 순서
 */
export type SortOrder = 'ASC' | 'DESC';

/**
 * 정렬 상태
 */
export interface RankingSort {
  field: RankingSortField;
  order: SortOrder;
}

/**
 * 랭킹 API 쿼리 파라미터
 */
export interface RankingQueryParams {
  service: ServiceType;
  date?: string;
  page?: number;
  limit?: number;
  sortField?: RankingSortField;
  sortOrder?: SortOrder;
}

/**
 * 순위 변동 타입
 */
export type RankChangeType = 'new' | 'up' | 'down' | 'same' | 'unknown';

/**
 * 순위 변동 정보로부터 변동 타입 추출
 */
export function getRankChangeType(
  rankChange: number | null,
  isNew: boolean,
): RankChangeType {
  if (isNew) return 'new';
  if (rankChange === null) return 'unknown';
  if (rankChange > 0) return 'up';
  if (rankChange < 0) return 'down';
  return 'same';
}

/**
 * Ant Design 정렬 순서 → API 정렬 순서 변환
 */
export function antdToApiSortOrder(
  antdOrder: AntdSortOrder,
): SortOrder | undefined {
  if (antdOrder === 'ascend') return 'ASC';
  if (antdOrder === 'descend') return 'DESC';
  return undefined;
}

/**
 * API 정렬 순서 → Ant Design 정렬 순서 변환
 */
export function apiToAntdSortOrder(apiOrder?: SortOrder): AntdSortOrder {
  if (apiOrder === 'ASC') return 'ascend';
  if (apiOrder === 'DESC') return 'descend';
  return null;
}

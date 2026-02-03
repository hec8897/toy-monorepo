import type { ServiceType } from '@toy-monorepo/types';

/**
 * 랭킹 API 쿼리 파라미터
 */
export interface RankingQueryParams {
  service: ServiceType;
  date?: string;
  page?: number;
  limit?: number;
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

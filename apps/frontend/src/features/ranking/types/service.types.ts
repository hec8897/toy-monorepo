import type { ServiceType } from '@toy-monorepo/types';

/**
 * 서비스별 표시 이름
 */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  oliveyoung: '올리브영',
  // coupang: '쿠팡',
  // amazon: '아마존',
};

/**
 * 서비스별 랭킹 API 엔드포인트
 */
export const SERVICE_ENDPOINTS: Record<ServiceType, string> = {
  oliveyoung: '/crawling/oliveyoung/best',
  // coupang: '/crawling/coupang/best',
  // amazon: '/crawling/amazon/best',
};

/**
 * 서비스별 스냅샷 API 엔드포인트
 */
export const SERVICE_SNAPSHOT_ENDPOINTS: Record<ServiceType, string> = {
  oliveyoung: '/crawling/oliveyoung/snapshots',
  // coupang: '/crawling/coupang/snapshots',
  // amazon: '/crawling/amazon/snapshots',
};

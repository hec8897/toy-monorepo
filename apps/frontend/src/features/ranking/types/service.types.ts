import type { ServiceType } from '@toy-monorepo/types';

// /**
//  * 지원하는 크롤링 서비스 타입
//  */
// export const SERVICE_TYPES = ['oliveyoung'] as const;
// export type ServiceType = (typeof SERVICE_TYPES)[number];

/**
 * 서비스별 표시 이름
 */
export const SERVICE_LABELS: Record<ServiceType, string> = {
  oliveyoung: '올리브영',
  // coupang: '쿠팡',
  // amazon: '아마존',
};

/**
 * 서비스별 API 엔드포인트
 */
export const SERVICE_ENDPOINTS: Record<ServiceType, string> = {
  oliveyoung: '/crawling/oliveyoung/best',
  // coupang: '/crawling/coupang/best',
  // amazon: '/crawling/amazon/best',
};

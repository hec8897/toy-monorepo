'use client';

import { useQuery } from '@tanstack/react-query';

import type { ServiceType } from '@toy-monorepo/types';

import { snapshotsQuery } from '../api/ranking.api';

/**
 * 서비스별 스냅샷 목록 조회 훅
 */
export function useSnapshotsQuery(service: ServiceType) {
  return useQuery({
    queryKey: snapshotsQuery.key(service),
    queryFn: () => snapshotsQuery.fetch(service),
  });
}

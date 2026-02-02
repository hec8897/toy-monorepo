'use client';

import { useQuery } from '@tanstack/react-query';

import { snapshotsQuery } from '../api/ranking.api';

import type { ServiceType } from '@toy-monorepo/types';

/**
 * 서비스별 스냅샷 목록 조회 훅
 */
export function useSnapshotsQuery(service: ServiceType) {
  return useQuery({
    queryKey: snapshotsQuery.key(service),
    queryFn: () => snapshotsQuery.fetch(service),
  });
}

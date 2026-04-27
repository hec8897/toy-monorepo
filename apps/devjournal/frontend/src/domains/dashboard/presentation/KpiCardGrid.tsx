'use client';

import { useDashboardKpisQuery } from '@/domains/dashboard/application/useDashboardKpisQuery';

import { KpiCard } from './KpiCard';

const KPI_CARD_COUNT = 4;

function KpiSkeleton() {
  return (
    <div className="flex flex-col gap-2 rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
      <div className="h-8 w-16 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function KpiErrorState() {
  return (
    <div className="col-span-full rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
      KPI 데이터를 불러올 수 없어요. 잠시 후 다시 시도해주세요.
    </div>
  );
}

export function KpiCardGrid() {
  const { data, isLoading, isError } = useDashboardKpisQuery();

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {isLoading
        ? Array.from({ length: KPI_CARD_COUNT }).map((_, idx) => (
            <KpiSkeleton key={idx} />
          ))
        : null}

      {isError ? <KpiErrorState /> : null}

      {data ? (
        <>
          <KpiCard label="총 일기 수" value={data.totalEntries} icon="📝" />
          <KpiCard label="학습 개념 수" value={data.totalConcepts} icon="💡" />
          <KpiCard
            label="마스터 개념 수"
            value={data.masteredConcepts}
            icon="🎯"
          />
          <KpiCard
            label="연속 작성 일수"
            value={data.currentStreak}
            icon="🔥"
          />
        </>
      ) : null}
    </div>
  );
}

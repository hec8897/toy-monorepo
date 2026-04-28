'use client';

import Link from 'next/link';

import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

import { useConceptGrowthQuery } from '@/domains/dashboard/application/useConceptGrowthQuery';

const DEFAULT_DAYS = 90;
const CHART_HEIGHT = 280;

function ChartSkeleton() {
  return (
    <div
      className="w-full animate-pulse rounded bg-gray-100"
      style={{ height: CHART_HEIGHT }}
    />
  );
}

function ChartError() {
  return (
    <div className="flex h-[280px] items-center justify-center rounded border border-red-200 bg-red-50 text-sm text-red-700">
      차트 데이터를 불러올 수 없어요.
    </div>
  );
}

function ChartEmptyState() {
  return (
    <div className="flex h-[280px] flex-col items-center justify-center gap-3 rounded border border-dashed border-gray-300 bg-gray-50 p-6 text-center">
      <p className="text-sm text-gray-600">
        아직 학습한 개념이 없어요. 일기를 작성해보세요.
      </p>
      <Link
        href="/journal"
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        ✏️ 일기 쓰러 가기
      </Link>
    </div>
  );
}

export function ConceptGrowthChart() {
  const { data, isLoading, isError } = useConceptGrowthQuery(DEFAULT_DAYS);

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-900">학습 개념 누적</h2>
        <span className="text-xs text-gray-500">최근 {DEFAULT_DAYS}일</span>
      </div>

      {isLoading ? <ChartSkeleton /> : null}
      {isError ? <ChartError /> : null}

      {data && data.length > 0 ? (
        data[data.length - 1].cumulative === 0 ? (
          <ChartEmptyState />
        ) : (
          <div style={{ width: '100%', height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={data}
                margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  tickFormatter={(value: string) => value.slice(5)}
                  minTickGap={24}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: '#6b7280' }}
                  allowDecimals={false}
                  width={32}
                />
                <Tooltip
                  contentStyle={{
                    fontSize: 12,
                    borderRadius: 8,
                    border: '1px solid #e5e7eb',
                  }}
                  labelFormatter={(label) => `날짜: ${label}`}
                  formatter={(value) => [`${value}개`, '누적 개념']}
                />
                <Line
                  type="monotone"
                  dataKey="cumulative"
                  stroke="#10b981"
                  strokeWidth={2}
                  dot={false}
                  activeDot={{ r: 4 }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )
      ) : null}
    </section>
  );
}

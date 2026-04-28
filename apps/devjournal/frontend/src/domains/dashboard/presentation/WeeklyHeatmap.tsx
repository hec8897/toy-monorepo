'use client';

import { useMemo } from 'react';

import Link from 'next/link';

import { useHeatmapQuery } from '@/domains/dashboard/application/useHeatmapQuery';

const HEATMAP_DAYS = 91;
const HEATMAP_ROWS = 7;
const HEATMAP_COLS = 13;

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토'] as const;

interface HeatmapDay {
  date: string;
  count: number;
}

function toIsoDate(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function buildCalendar(countsByDate: Map<string, number>): HeatmapDay[][] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const cells: HeatmapDay[] = [];
  for (let i = HEATMAP_DAYS - 1; i >= 0; i -= 1) {
    const day = new Date(today);
    day.setDate(today.getDate() - i);
    const iso = toIsoDate(day);
    cells.push({ date: iso, count: countsByDate.get(iso) ?? 0 });
  }

  const grid: HeatmapDay[][] = Array.from({ length: HEATMAP_ROWS }, () =>
    Array.from({ length: HEATMAP_COLS }, () => ({ date: '', count: 0 })),
  );

  // 오늘을 마지막 열의 오늘 요일 칸에 두고, 뒤에서부터 역방향으로 채운다.
  // 마지막 열에서 오늘 이후(미래) 요일은 placeholder로 남긴다.
  const todayWeekday = today.getDay(); // 0=일 ~ 6=토
  let cellIdx = cells.length - 1;
  for (let col = HEATMAP_COLS - 1; col >= 0; col -= 1) {
    for (let row = HEATMAP_ROWS - 1; row >= 0; row -= 1) {
      if (col === HEATMAP_COLS - 1 && row > todayWeekday) {
        continue;
      }
      if (cellIdx < 0) {
        continue;
      }
      grid[row][col] = cells[cellIdx];
      cellIdx -= 1;
    }
  }

  return grid;
}

function getCellColor(count: number, isPlaceholder: boolean): string {
  if (isPlaceholder) return 'bg-transparent';
  if (count === 0) return 'bg-gray-100';
  if (count === 1) return 'bg-emerald-200';
  if (count === 2) return 'bg-emerald-400';
  if (count === 3) return 'bg-emerald-600';
  return 'bg-emerald-800';
}

function HeatmapSkeleton() {
  return (
    <div className="grid grid-rows-7 gap-1">
      {Array.from({ length: HEATMAP_ROWS }).map((_, row) => (
        <div
          key={row}
          className="grid gap-1"
          style={{
            gridTemplateColumns: `repeat(${HEATMAP_COLS}, minmax(0, 1fr))`,
          }}
        >
          {Array.from({ length: HEATMAP_COLS }).map((_, col) => (
            <div
              key={col}
              className="aspect-square animate-pulse rounded-sm bg-gray-200"
            />
          ))}
        </div>
      ))}
    </div>
  );
}

function HeatmapError() {
  return (
    <div className="rounded border border-red-200 bg-red-50 p-3 text-sm text-red-700">
      히트맵 데이터를 불러올 수 없어요.
    </div>
  );
}

function HeatmapEmptyState() {
  return (
    <div className="mt-3 flex flex-col items-center gap-2 rounded border border-dashed border-gray-300 bg-gray-50 p-4 text-center">
      <p className="text-sm text-gray-600">
        최근 {HEATMAP_DAYS}일간 작성한 일기가 없어요.
      </p>
      <Link
        href="/journal"
        className="inline-flex items-center gap-2 rounded-md bg-gray-900 px-3 py-1.5 text-xs font-medium text-white transition-colors hover:bg-gray-700"
      >
        ✏️ 일기 쓰러 가기
      </Link>
    </div>
  );
}

export function WeeklyHeatmap() {
  const { data, isLoading, isError } = useHeatmapQuery(HEATMAP_DAYS);

  const grid = useMemo(() => {
    const map = new Map<string, number>();
    if (data) {
      data.forEach((cell) => {
        map.set(cell.date, cell.count);
      });
    }
    return buildCalendar(map);
  }, [data]);

  const isEmpty =
    !!data && data.length > 0 ? data.every((cell) => cell.count === 0) : !!data;

  return (
    <section className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-lg font-semibold text-gray-900">작성 캘린더</h2>
        <span className="text-xs text-gray-500">최근 {HEATMAP_DAYS}일</span>
      </div>

      {isLoading ? <HeatmapSkeleton /> : null}
      {isError ? <HeatmapError /> : null}

      {data ? (
        <>
          <div className="flex items-stretch gap-2">
            {/* 요일 라벨 (월/수/금만 노출) */}
            <div className="grid grid-rows-7 gap-1 pr-1 text-[10px] text-gray-400">
              {DAY_LABELS.map((label, idx) => (
                <span
                  key={label}
                  className="flex h-full items-center"
                  aria-hidden={idx !== 1 && idx !== 3 && idx !== 5}
                >
                  {idx === 1 || idx === 3 || idx === 5 ? label : ''}
                </span>
              ))}
            </div>
            {/* 셀 그리드 — 박스 폭에 균등 분배 */}
            <div
              role="grid"
              aria-label="작성 캘린더"
              className="grid flex-1 grid-rows-7 gap-1"
            >
              {Array.from({ length: HEATMAP_ROWS }).map((_, row) => (
                <div
                  key={row}
                  role="row"
                  className="grid gap-1"
                  style={{
                    gridTemplateColumns: `repeat(${HEATMAP_COLS}, minmax(0, 1fr))`,
                  }}
                >
                  {grid[row].map((cell, col) => {
                    const isPlaceholder = cell.date === '';
                    return (
                      <div
                        key={`${row}-${col}`}
                        role="gridcell"
                        title={
                          isPlaceholder
                            ? undefined
                            : `${cell.date} · ${cell.count}편`
                        }
                        aria-label={
                          isPlaceholder
                            ? undefined
                            : `${cell.date} ${cell.count}편`
                        }
                        className={`aspect-square rounded-sm ${getCellColor(
                          cell.count,
                          isPlaceholder,
                        )}`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          {/* 색상 범례 */}
          <div className="mt-3 flex items-center justify-end gap-1 text-[10px] text-gray-500">
            <span>적음</span>
            <span className="h-3 w-3 rounded-sm bg-gray-100" />
            <span className="h-3 w-3 rounded-sm bg-emerald-200" />
            <span className="h-3 w-3 rounded-sm bg-emerald-400" />
            <span className="h-3 w-3 rounded-sm bg-emerald-600" />
            <span className="h-3 w-3 rounded-sm bg-emerald-800" />
            <span>많음</span>
          </div>

          {isEmpty ? <HeatmapEmptyState /> : null}
        </>
      ) : null}
    </section>
  );
}

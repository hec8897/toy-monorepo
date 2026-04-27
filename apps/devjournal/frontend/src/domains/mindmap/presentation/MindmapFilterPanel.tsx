'use client';

import { useMemo, useState } from 'react';

import type { MasteryLevel, MyMindmapNode } from '@devjournal/types';

import { useMindmapStore } from '@/domains/mindmap/application/mindmapStore';
import { useMindmapFilterMatch } from '@/domains/mindmap/application/useMindmapFilterMatch';
import { getCategoryColor } from '@/domains/mindmap/domain/categoryColors';

interface Props {
  nodes: MyMindmapNode[];
}

const MASTERY_LEVELS: MasteryLevel[] = ['learning', 'familiar', 'mastered'];

const MASTERY_COLOR: Record<MasteryLevel, string> = {
  learning: '#9ca3af', // gray-400
  familiar: '#3b82f6', // blue-500
  mastered: '#10b981', // green-500
};

export function MindmapFilterPanel({ nodes }: Props) {
  const searchQuery = useMindmapStore((s) => s.searchQuery);
  const setSearch = useMindmapStore((s) => s.setSearch);
  const categoryFilters = useMindmapStore((s) => s.categoryFilters);
  const toggleCategory = useMindmapStore((s) => s.toggleCategory);
  const masteryFilters = useMindmapStore((s) => s.masteryFilters);
  const toggleMastery = useMindmapStore((s) => s.toggleMastery);
  const clearFilters = useMindmapStore((s) => s.clearFilters);

  const { matched, total } = useMindmapFilterMatch(nodes);

  // 모바일 펼침/접힘 상태. 데스크탑은 CSS sm:block으로 강제 표시되므로
  // 이 state는 모바일 토글에만 영향. 첫 진입 시 모바일은 접힘 (캔버스 보호).
  const [isOpen, setIsOpen] = useState<boolean>(false);

  const availableCategories = useMemo(
    () => Array.from(new Set(nodes.map((n) => n.category))).sort(),
    [nodes],
  );

  const hasActiveFilter =
    searchQuery.trim().length > 0 ||
    categoryFilters.size > 0 ||
    masteryFilters.size > 0;

  const isEmpty = matched === 0 && hasActiveFilter;

  return (
    <div className="absolute left-4 right-4 top-20 z-10 rounded-md border border-gray-200 bg-white/90 p-3 shadow-sm backdrop-blur-sm sm:left-6 sm:right-auto sm:w-[300px]">
      {/* 모바일 전용 토글 헤더 */}
      <button
        type="button"
        onClick={() => setIsOpen((o) => !o)}
        className="flex w-full items-center justify-between text-sm font-medium text-gray-700 sm:hidden"
        aria-expanded={isOpen}
      >
        <span>
          🔍 검색·필터
          {hasActiveFilter && (
            <span className="ml-2 text-xs text-blue-600">
              · 활성 ({matched}/{total})
            </span>
          )}
        </span>
        <span className="text-xs text-gray-500">{isOpen ? '▲' : '▼'}</span>
      </button>

      {/* 본문 — 모바일은 isOpen 토글, 데스크탑은 항상 표시 */}
      <div className={`${isOpen ? 'mt-3 sm:mt-0' : 'hidden'} sm:block`}>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="🔍 개념명 검색..."
          className="w-full rounded border border-gray-200 px-3 py-1.5 text-sm focus:border-blue-400 focus:outline-none"
        />

        <FilterChipGroup
          label="카테고리"
          items={availableCategories}
          activeSet={categoryFilters}
          onToggle={toggleCategory}
          getActiveColor={getCategoryColor}
        />

        <FilterChipGroup
          label="숙련도"
          items={MASTERY_LEVELS}
          activeSet={masteryFilters}
          onToggle={(level) => toggleMastery(level as MasteryLevel)}
          getActiveColor={(level) => MASTERY_COLOR[level as MasteryLevel]}
        />

        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={isEmpty ? 'text-red-600' : 'text-gray-500'}>
            {isEmpty ? '매칭된 노드 없음' : `${matched} / ${total} 노드 매칭`}
          </span>
          {hasActiveFilter && (
            <button
              type="button"
              onClick={clearFilters}
              className="cursor-pointer text-blue-600 underline"
            >
              초기화
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

interface ChipGroupProps {
  label: string;
  items: readonly string[];
  activeSet: Set<string>;
  onToggle: (item: string) => void;
  getActiveColor: (item: string) => string;
}

function FilterChipGroup({
  label,
  items,
  activeSet,
  onToggle,
  getActiveColor,
}: ChipGroupProps) {
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <div className="mb-1.5 text-xs font-medium text-gray-600">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const isActive = activeSet.has(item);
          return (
            <button
              key={item}
              type="button"
              onClick={() => onToggle(item)}
              className="rounded-full px-2.5 py-0.5 text-xs transition-colors"
              style={
                isActive
                  ? { backgroundColor: getActiveColor(item), color: '#fff' }
                  : { border: '1px solid #e5e7eb', color: '#4b5563' }
              }
            >
              {item}
            </button>
          );
        })}
      </div>
    </div>
  );
}

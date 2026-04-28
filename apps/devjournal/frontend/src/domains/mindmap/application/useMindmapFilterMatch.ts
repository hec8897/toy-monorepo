'use client';

import { useMemo } from 'react';

import type { MasteryLevel, MyMindmapNode } from '@devjournal/types';

import { useMindmapStore } from './mindmapStore';

export interface MindmapFilterMatchResult {
  /** null = 필터 비활성 (모든 노드 정상). Set = 매칭된 노드 ID들. */
  matchedIds: Set<string> | null;
  total: number;
  matched: number;
}

/**
 * 검색·필터 조건을 노드에 적용해 매칭된 ID Set을 반환.
 * 검색·카테고리·mastery 모두 비활성이면 matchedIds = null (모든 노드 정상).
 */
export function useMindmapFilterMatch(
  nodes: MyMindmapNode[],
): MindmapFilterMatchResult {
  const searchQuery = useMindmapStore((s) => s.searchQuery);
  const categoryFilters = useMindmapStore((s) => s.categoryFilters);
  const masteryFilters = useMindmapStore((s) => s.masteryFilters);

  return useMemo(() => {
    const allInactive =
      !searchQuery.trim() &&
      categoryFilters.size === 0 &&
      masteryFilters.size === 0;

    if (allInactive) {
      return { matchedIds: null, total: nodes.length, matched: nodes.length };
    }

    const q = searchQuery.trim().toLowerCase();
    const matchedIds = new Set(
      nodes
        .filter((n) => matches(n, q, categoryFilters, masteryFilters))
        .map((n) => n.id),
    );
    return { matchedIds, total: nodes.length, matched: matchedIds.size };
  }, [nodes, searchQuery, categoryFilters, masteryFilters]);
}

function matches(
  node: MyMindmapNode,
  query: string,
  categories: Set<string>,
  mastery: Set<MasteryLevel>,
): boolean {
  if (query && !node.name.toLowerCase().includes(query)) return false;
  if (categories.size > 0 && !categories.has(node.category)) return false;
  if (mastery.size > 0 && !mastery.has(node.mastery)) return false;
  return true;
}

import { create } from 'zustand';

import type { MasteryLevel } from '@devjournal/types';

interface MindmapStore {
  // Drawer
  selectedConceptId: string | null;
  selectConcept: (id: string | null) => void;

  // 호버 강조 (1-hop neighbor)
  hoveredNodeId: string | null;
  setHovered: (id: string | null) => void;

  // 호버 엣지 (relation_type 라벨)
  hoveredEdgeKey: string | null;
  setHoveredEdge: (key: string | null) => void;

  // 검색·필터
  searchQuery: string;
  setSearch: (query: string) => void;

  categoryFilters: Set<string>;
  toggleCategory: (category: string) => void;

  masteryFilters: Set<MasteryLevel>;
  toggleMastery: (level: MasteryLevel) => void;

  clearFilters: () => void;
}

const toggleInSet = <T>(set: Set<T>, value: T): Set<T> => {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
};

export const useMindmapStore = create<MindmapStore>((set) => ({
  selectedConceptId: null,
  selectConcept: (id) => set({ selectedConceptId: id }),

  hoveredNodeId: null,
  setHovered: (id) => set({ hoveredNodeId: id }),

  hoveredEdgeKey: null,
  setHoveredEdge: (key) => set({ hoveredEdgeKey: key }),

  searchQuery: '',
  setSearch: (query) => set({ searchQuery: query }),

  categoryFilters: new Set<string>(),
  toggleCategory: (category) =>
    set((state) => ({
      categoryFilters: toggleInSet(state.categoryFilters, category),
    })),

  masteryFilters: new Set<MasteryLevel>(),
  toggleMastery: (level) =>
    set((state) => ({
      masteryFilters: toggleInSet(state.masteryFilters, level),
    })),

  clearFilters: () =>
    set({
      searchQuery: '',
      categoryFilters: new Set<string>(),
      masteryFilters: new Set<MasteryLevel>(),
    }),
}));

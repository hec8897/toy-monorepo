import { create } from 'zustand';

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
}

export const useMindmapStore = create<MindmapStore>((set) => ({
  selectedConceptId: null,
  selectConcept: (id) => set({ selectedConceptId: id }),

  hoveredNodeId: null,
  setHovered: (id) => set({ hoveredNodeId: id }),

  hoveredEdgeKey: null,
  setHoveredEdge: (key) => set({ hoveredEdgeKey: key }),
}));

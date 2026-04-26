import { create } from 'zustand';

interface MindmapStore {
  selectedConceptId: string | null;
  selectConcept: (id: string | null) => void;
}

export const useMindmapStore = create<MindmapStore>((set) => ({
  selectedConceptId: null,
  selectConcept: (id) => set({ selectedConceptId: id }),
}));

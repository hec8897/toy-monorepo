import type { ConceptDetail, MyMindmapGraph } from '@devjournal/types';

import { api } from '@/shared/lib/httpClient';

export const mindmapApi = {
  getMyMindmap: () => api.get<MyMindmapGraph>('/mindmap').then((r) => r.data),

  getConceptDetail: (conceptId: string) =>
    api
      .get<ConceptDetail>(`/mindmap/concepts/${conceptId}`)
      .then((r) => r.data),
};

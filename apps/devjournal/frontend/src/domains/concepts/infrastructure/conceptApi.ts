import type { Concept } from '@devjournal/types';

import type { UserConceptWithConcept } from '@/domains/concepts/domain/concept';
import { api } from '@/shared/lib/httpClient';

export const conceptApi = {
  getConcepts: (limit?: number, offset?: number) =>
    api
      .get<Concept[]>('/concepts', { params: { limit, offset } })
      .then((r) => r.data),

  getUserConcepts: () =>
    api.get<UserConceptWithConcept[]>('/concepts/user').then((r) => r.data),

  searchConcepts: (q: string) =>
    api
      .get<Concept[]>('/concepts/search', { params: { q } })
      .then((r) => r.data),

  getConcept: (id: string) =>
    api.get<Concept>(`/concepts/${id}`).then((r) => r.data),
};

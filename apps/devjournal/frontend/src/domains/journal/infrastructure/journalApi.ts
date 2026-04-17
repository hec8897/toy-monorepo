import type { Entry, EntryConceptResponse } from '@devjournal/types';

import type { CreateEntryInput } from '@/domains/journal/domain/entry';
import { api } from '@/shared/lib/httpClient';

export const journalApi = {
  getEntries: () => api.get<Entry[]>('/entries').then((r) => r.data),

  getEntry: (id: string) =>
    api.get<Entry>(`/entries/${id}`).then((r) => r.data),

  createEntry: (data: CreateEntryInput) =>
    api.post<Entry>('/entries', data).then((r) => r.data),

  deleteEntry: (id: string) => api.delete(`/entries/${id}`),

  getEntryConcepts: (id: string) =>
    api
      .get<EntryConceptResponse[]>(`/entries/${id}/concepts`)
      .then((r) => r.data),
};

import type { Entry } from '@devjournal/types';

import { api } from '@/shared/lib/api';

import type { CreateEntryInput } from '../types';

export const journalApi = {
  getEntries: () => api.get<Entry[]>('/entries').then((r) => r.data),

  getEntry: (id: string) =>
    api.get<Entry>(`/entries/${id}`).then((r) => r.data),

  createEntry: (data: CreateEntryInput) =>
    api.post<Entry>('/entries', data).then((r) => r.data),

  deleteEntry: (id: string) => api.delete(`/entries/${id}`),
};

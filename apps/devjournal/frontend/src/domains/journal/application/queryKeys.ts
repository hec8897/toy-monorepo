export const journalQueryKeys = {
  all: ['journal'] as const,
  entries: () => [...journalQueryKeys.all, 'entries'] as const,
  detail: (id: string) => [...journalQueryKeys.all, 'detail', id] as const,
  concepts: (id: string) => [...journalQueryKeys.all, 'concepts', id] as const,
};

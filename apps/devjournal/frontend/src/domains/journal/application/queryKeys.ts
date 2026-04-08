export const journalQueryKeys = {
  all: ['journal'] as const,
  entries: () => [...journalQueryKeys.all, 'entries'] as const,
};

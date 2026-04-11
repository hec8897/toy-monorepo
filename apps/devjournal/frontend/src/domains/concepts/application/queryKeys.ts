export const conceptQueryKeys = {
  all: ['concepts'] as const,
  lists: () => [...conceptQueryKeys.all, 'list'] as const,
  search: (q: string) => [...conceptQueryKeys.all, 'search', q] as const,
  user: () => [...conceptQueryKeys.all, 'user'] as const,
  detail: (id: string) => [...conceptQueryKeys.all, id] as const,
};

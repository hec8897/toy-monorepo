export const mindmapQueryKeys = {
  all: ['mindmap'] as const,
  graph: () => [...mindmapQueryKeys.all, 'graph'] as const,
  conceptDetail: (conceptId: string) =>
    [...mindmapQueryKeys.all, 'concept', conceptId] as const,
};

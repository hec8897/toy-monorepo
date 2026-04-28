export const dashboardKeys = {
  all: ['dashboard'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  conceptGrowth: (days: number) =>
    [...dashboardKeys.all, 'concept-growth', days] as const,
  heatmap: (days: number) => [...dashboardKeys.all, 'heatmap', days] as const,
};

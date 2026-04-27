import type {
  ConceptGrowthPoint,
  DashboardKpis,
  HeatmapCell,
} from '@toy-monorepo/types';

import { api } from '@/shared/lib/httpClient';

export const dashboardApi = {
  getKpis: () => api.get<DashboardKpis>('/dashboard/kpis').then((r) => r.data),

  getConceptGrowth: (days = 90) =>
    api
      .get<ConceptGrowthPoint[]>('/dashboard/concept-growth', {
        params: { days },
      })
      .then((r) => r.data),

  getHeatmap: (days = 91) =>
    api
      .get<HeatmapCell[]>('/dashboard/heatmap', {
        params: { days },
      })
      .then((r) => r.data),
};

export interface DashboardKpis {
  totalEntries: number;
  totalConcepts: number;
  masteredConcepts: number;
  currentStreak: number;
}

export interface ConceptGrowthPoint {
  date: string;
  cumulative: number;
}

export interface HeatmapCell {
  date: string;
  count: number;
}

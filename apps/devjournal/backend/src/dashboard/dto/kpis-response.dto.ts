import type { DashboardKpis } from '@toy-monorepo/types';

export class KpisResponseDto implements DashboardKpis {
  totalEntries!: number;
  totalConcepts!: number;
  masteredConcepts!: number;
  currentStreak!: number;
}

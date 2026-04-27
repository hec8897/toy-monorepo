import type { HeatmapCell } from '@toy-monorepo/types';

export class HeatmapCellDto implements HeatmapCell {
  date!: string;
  count!: number;
}

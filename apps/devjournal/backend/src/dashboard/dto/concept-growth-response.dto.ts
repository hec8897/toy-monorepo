import type { ConceptGrowthPoint } from '@toy-monorepo/types';

export class ConceptGrowthPointDto implements ConceptGrowthPoint {
  date!: string;
  cumulative!: number;
}

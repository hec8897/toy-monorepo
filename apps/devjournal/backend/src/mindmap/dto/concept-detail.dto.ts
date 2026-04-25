import type { MasteryLevel } from './mindmap-graph.dto';

export interface EntryRefDto {
  id: string;
  title: string | null;
  created_at: string;
}

export interface ConceptDetailDto {
  id: string;
  name: string;
  category: string;
  description: string | null;
  mastery: MasteryLevel;
  review_count: number;
  related_entries: EntryRefDto[];
}

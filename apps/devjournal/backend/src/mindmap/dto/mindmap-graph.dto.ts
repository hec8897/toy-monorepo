export type MasteryLevel = 'learning' | 'familiar' | 'mastered';

export interface MindmapNodeDto {
  id: string;
  name: string;
  category: string;
  mastery: MasteryLevel;
  review_count: number;
}

export interface MindmapEdgeDto {
  from: string;
  to: string;
  strength: number;
  type: string;
}

export interface MindmapGraphDto {
  nodes: MindmapNodeDto[];
  edges: MindmapEdgeDto[];
}

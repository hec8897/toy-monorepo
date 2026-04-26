export type MasteryLevel = 'learning' | 'familiar' | 'mastered';

export interface MindmapNodeDto {
  id: string;
  name: string;
  category: string;
  mastery: MasteryLevel;
  review_count: number;
  /** 사용자의 가장 최근 일기로 처음 등장한 개념 — UI 강조용 */
  is_recent: boolean;
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

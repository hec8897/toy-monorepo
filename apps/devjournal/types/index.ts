// ─── Enum 타입 ────────────────────────────────────────────────────────────────

export type ConceptCategory =
  | 'language'
  | 'framework'
  | 'pattern'
  | 'principle'
  | 'tool'
  | 'concept'
  | 'algorithm'
  | 'database'
  | 'devops'
  | 'other';

export type RelationType =
  | 'is_related_to'
  | 'is_prerequisite_of'
  | 'is_implementation_of'
  | 'is_part_of'
  | 'is_alternative_to'
  | 'is_opposite_of'
  | 'is_used_with';

export type AnalysisStatus = 'pending' | 'processing' | 'completed' | 'failed';

export type MasteryLevel = 'learning' | 'familiar' | 'mastered';

export type ConceptSource = 'ai_extracted' | 'user_defined' | 'seed';

// ─── DB 테이블 행 타입 ─────────────────────────────────────────────────────────

export interface UserProfile {
  id: string;
  display_name: string | null;
  timezone: string;
  created_at: string;
  updated_at: string;
}

export interface Concept {
  id: string;
  name: string;
  name_lower: string;
  category: ConceptCategory;
  description: string | null;
  aliases: string[] | null;
  embedding: number[] | null;
  source: ConceptSource;
  usage_count: number;
  created_at: string;
  updated_at: string;
}

export interface Entry {
  id: string;
  user_id: string;
  content: string;
  title: string | null;
  summary: string | null;
  embedding: number[] | null;
  analysis_status: AnalysisStatus;
  analysis_error: string | null;
  analyzed_at: string | null;
  is_published: boolean;
  published_at: string | null;
  slug: string | null;
  seo_title: string | null;
  seo_description: string | null;
  seo_tags: string[] | null;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface EntryConceptRow {
  entry_id: string;
  concept_id: string;
  confidence: number;
}

export type EntryConceptResponse = Omit<Concept, 'embedding'> & {
  confidence: number;
};

export interface Connection {
  from_id: string;
  to_id: string;
  strength: number;
  relation_type: RelationType;
  created_by: 'ai' | 'user';
}

export interface UserConcept {
  user_id: string;
  concept_id: string;
  learned_at: string;
  review_count: number;
  last_reviewed_at: string | null;
  ease_factor: number;
  next_review_at: string | null;
  mastery_level: MasteryLevel;
}

// ─── Agent Tool 입출력 타입 ────────────────────────────────────────────────────

export interface ExtractedConcept {
  name: string;
  category: ConceptCategory;
  confidence: number;
  description: string;
  aliases: string[];
}

export interface ExtractConceptsOutput {
  concepts: ExtractedConcept[];
  entry_summary: string;
  primary_topic: string;
}

export interface ConceptConnection {
  from_concept: string;
  to_concept: string;
  strength: number;
  relation_type: RelationType;
  explanation: string;
}

export interface SearchConnectionsOutput {
  connections: ConceptConnection[];
  cluster_suggestion: string;
}

export interface MindmapNode {
  id: string;
  label: string;
  category: string;
  weight: number;
  is_new: boolean;
  group: string;
}

export interface MindmapLink {
  source: string;
  target: string;
  strength: number;
  relation_type: string;
  label: string;
}

export interface BuildMindmapOutput {
  nodes: MindmapNode[];
  links: MindmapLink[];
  center_node_id: string;
  layout_hint: {
    charge_strength: number;
    link_distance: number;
  };
}

export interface RecommendationItem {
  concept_name: string;
  reason: string;
  priority: number;
  estimated_difficulty: 'beginner' | 'intermediate' | 'advanced';
  prerequisite_satisfied: boolean;
  related_to_today: string[];
  resource_hint: string;
}

export interface RecommendNextOutput {
  recommendations: RecommendationItem[];
  learning_pattern_analysis: string;
  streak_encouragement: string;
}

// ─── SSE 이벤트 타입 ───────────────────────────────────────────────────────────

export type SSEEventType =
  | 'progress'
  | 'concepts_extracted'
  | 'connections_found'
  | 'mindmap_updated'
  | 'recommendations_ready'
  | 'analysis_complete'
  | 'step_failed'
  | 'error';

export interface SSEProgressData {
  step: 1 | 2 | 3 | 4;
  message: string;
}

export interface SSEConceptsExtractedData {
  concepts: ExtractedConcept[];
  entry_summary: string;
}

export interface SSEConnectionsFoundData {
  connections: ConceptConnection[];
}

export interface SSEMindmapUpdatedData {
  delta: { nodes: MindmapNode[]; links: MindmapLink[] };
  total_node_count: number;
}

export interface SSERecommendationsReadyData {
  recommendations: RecommendationItem[];
}

export interface SSEStepFailedData {
  step: number;
  will_retry: boolean;
}

export interface SSEErrorData {
  message: string;
}

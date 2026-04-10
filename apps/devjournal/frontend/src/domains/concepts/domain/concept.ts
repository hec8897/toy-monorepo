import type { Concept, ConceptCategory, MasteryLevel } from '@devjournal/types';

export type { Concept, UserConcept, ConceptCategory, MasteryLevel } from '@devjournal/types';

export type UserConceptWithConcept = {
  user_id: string;
  concept_id: string;
  learned_at: string;
  review_count: number;
  last_reviewed_at: string | null;
  ease_factor: number;
  next_review_at: string | null;
  mastery_level: MasteryLevel;
  concepts: Concept;
};

export function getMasteryLabel(level: MasteryLevel): '학습 중' | '익숙함' | '마스터' {
  const labels: Record<MasteryLevel, '학습 중' | '익숙함' | '마스터'> = {
    learning: '학습 중',
    familiar: '익숙함',
    mastered: '마스터',
  };
  return labels[level];
}

export function getCategoryColor(category: ConceptCategory): string {
  const colors: Record<ConceptCategory, string> = {
    language: 'bg-blue-100 text-blue-700',
    framework: 'bg-purple-100 text-purple-700',
    pattern: 'bg-yellow-100 text-yellow-700',
    principle: 'bg-green-100 text-green-700',
    tool: 'bg-orange-100 text-orange-700',
    concept: 'bg-gray-100 text-gray-700',
    algorithm: 'bg-red-100 text-red-700',
    database: 'bg-cyan-100 text-cyan-700',
    devops: 'bg-indigo-100 text-indigo-700',
    other: 'bg-slate-100 text-slate-700',
  };
  return colors[category];
}

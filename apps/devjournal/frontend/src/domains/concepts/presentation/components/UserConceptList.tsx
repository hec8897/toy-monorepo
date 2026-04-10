import { getMasteryLabel, getCategoryColor } from '@/domains/concepts/domain/concept';
import type { UserConceptWithConcept } from '@/domains/concepts/domain/concept';

interface UserConceptListProps {
  userConcepts: UserConceptWithConcept[];
  isLoading: boolean;
}

const MASTERY_BADGE_STYLES: Record<string, string> = {
  '학습 중': 'bg-yellow-100 text-yellow-700',
  '익숙함': 'bg-blue-100 text-blue-700',
  '마스터': 'bg-green-100 text-green-700',
};

export function UserConceptList({ userConcepts, isLoading }: UserConceptListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100" />
        ))}
      </div>
    );
  }

  if (userConcepts.length === 0) {
    return (
      <p className="text-sm text-gray-400">학습한 개념이 없습니다.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {userConcepts.map((userConcept) => {
        const concept = userConcept.concepts;
        const masteryLabel = getMasteryLabel(userConcept.mastery_level);

        return (
          <li
            key={userConcept.concept_id}
            className="rounded-md border border-gray-200 p-4 space-y-2"
          >
            <div className="flex items-start justify-between gap-2">
              <p className="text-sm font-medium text-gray-900">{concept.name}</p>
              <div className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(concept.category)}`}
                >
                  {concept.category}
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${MASTERY_BADGE_STYLES[masteryLabel]}`}
                >
                  {masteryLabel}
                </span>
              </div>
            </div>
            {concept.description && (
              <p className="text-xs text-gray-500 line-clamp-2">{concept.description}</p>
            )}
            <p className="text-xs text-gray-400">
              복습 횟수: {userConcept.review_count}
            </p>
          </li>
        );
      })}
    </ul>
  );
}

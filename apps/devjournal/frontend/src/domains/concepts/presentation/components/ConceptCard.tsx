import type { Concept } from '@/domains/concepts/domain/concept';
import { getCategoryColor } from '@/domains/concepts/domain/concept';

interface ConceptCardProps {
  concept: Concept;
}

export function ConceptCard({ concept }: ConceptCardProps) {
  return (
    <div className="rounded-md border border-gray-200 p-4 space-y-2">
      <div className="flex items-start justify-between gap-2">
        <p className="text-sm font-medium text-gray-900">{concept.name}</p>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${getCategoryColor(concept.category)}`}
        >
          {concept.category}
        </span>
      </div>
      {concept.description && (
        <p className="text-xs text-gray-500 line-clamp-2">
          {concept.description}
        </p>
      )}
      <p className="text-xs text-gray-400">사용 횟수: {concept.usage_count}</p>
    </div>
  );
}

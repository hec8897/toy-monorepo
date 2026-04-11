import type { Concept } from '@/domains/concepts/domain/concept';
import { ConceptCard } from '@/domains/concepts/presentation/components/ConceptCard';

interface ConceptListProps {
  concepts: Concept[];
  isLoading: boolean;
  isError: boolean;
}

export function ConceptList({
  concepts,
  isLoading,
  isError,
}: ConceptListProps) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-md bg-gray-100" />
        ))}
      </div>
    );
  }

  if (isError) {
    return <p className="text-sm text-red-500">개념을 불러오지 못했습니다.</p>;
  }

  if (concepts.length === 0) {
    return (
      <p className="text-sm text-gray-400">
        아직 분석된 개념이 없습니다. 일기를 작성하면 AI가 개념을 추출합니다.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {concepts.map((concept) => (
        <li key={concept.id}>
          <ConceptCard concept={concept} />
        </li>
      ))}
    </ul>
  );
}

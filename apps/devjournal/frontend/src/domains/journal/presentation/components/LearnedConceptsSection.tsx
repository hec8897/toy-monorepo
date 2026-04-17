import type { AnalysisStatus, EntryConceptResponse } from '@devjournal/types';

import { ConceptBadge } from './ConceptBadge';

interface LearnedConceptsSectionProps {
  status: AnalysisStatus;
  concepts: EntryConceptResponse[] | undefined;
  isLoading: boolean;
}

interface ConceptsContentProps {
  isLoading: boolean;
  concepts: EntryConceptResponse[] | undefined;
}

function ConceptsContent({ isLoading, concepts }: ConceptsContentProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="h-6 w-16 animate-pulse rounded-full bg-gray-200"
          />
        ))}
      </div>
    );
  }

  if (!concepts || concepts.length === 0) {
    return <p className="text-sm text-gray-400">추출된 개념이 없습니다.</p>;
  }

  return (
    <div className="flex flex-wrap gap-2">
      {concepts.map((concept) => (
        <ConceptBadge
          key={concept.id}
          name={concept.name}
          category={concept.category}
          description={concept.description}
        />
      ))}
    </div>
  );
}

export function LearnedConceptsSection({
  status,
  concepts,
  isLoading,
}: LearnedConceptsSectionProps) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">💡</span>
        <h2 className="text-sm font-semibold text-gray-700">학습한 개념</h2>
      </div>

      {(status === 'pending' || status === 'processing') && (
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
          AI가 개념을 분석 중이에요...
        </div>
      )}

      {status === 'failed' && (
        <p className="text-sm text-red-400">분석 중 오류가 발생했어요.</p>
      )}

      {status === 'completed' && (
        <ConceptsContent isLoading={isLoading} concepts={concepts} />
      )}
    </div>
  );
}

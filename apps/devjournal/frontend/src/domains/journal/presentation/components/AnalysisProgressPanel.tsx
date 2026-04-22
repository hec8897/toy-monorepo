import type { AnalysisState } from '@/domains/journal/application/useJournalAnalysis';

interface StepItemProps {
  step: 1 | 2;
  label: string;
  currentStep: 0 | 1 | 2;
  isComplete: boolean;
}

function StepItem({ step, label, currentStep, isComplete }: StepItemProps) {
  const isActive = currentStep === step;
  const isDone = isComplete || currentStep > step;

  return (
    <div className="flex items-center gap-2">
      <div
        className={[
          'flex h-5 w-5 items-center justify-center rounded-full text-xs font-medium shrink-0',
          isDone
            ? 'bg-green-100 text-green-600'
            : isActive
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-400',
        ].join(' ')}
      >
        {isDone ? '✓' : step}
      </div>
      <span
        className={[
          'text-sm',
          isDone
            ? 'text-green-600'
            : isActive
              ? 'text-blue-600 font-medium'
              : 'text-gray-400',
        ].join(' ')}
      >
        {label}
      </span>
      {isActive && (
        <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-blue-400 border-t-transparent" />
      )}
    </div>
  );
}

interface AnalysisProgressPanelProps {
  analysisState: AnalysisState;
}

export function AnalysisProgressPanel({
  analysisState,
}: AnalysisProgressPanelProps) {
  const { currentStep, concepts, connections, isComplete, error } =
    analysisState;

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-5 space-y-2">
        <div className="flex items-center gap-2">
          <span className="text-base">⚠️</span>
          <h2 className="text-sm font-semibold text-red-700">분석 실패</h2>
        </div>
        <p className="text-sm text-red-500">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-5 space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-base">🤖</span>
        <h2 className="text-sm font-semibold text-blue-700">
          {isComplete ? 'AI 분석 완료' : 'AI 분석 중...'}
        </h2>
      </div>

      <div className="space-y-2">
        <StepItem
          step={1}
          label="개념 추출"
          currentStep={currentStep}
          isComplete={isComplete}
        />
        <StepItem
          step={2}
          label="연결 관계 분석"
          currentStep={currentStep}
          isComplete={isComplete}
        />
      </div>

      {concepts.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-600">
            추출된 개념 ({concepts.length}개)
          </p>
          <div className="flex flex-wrap gap-1.5">
            {concepts.map((c) => (
              <span
                key={c.name}
                className="rounded-full bg-white px-2.5 py-0.5 text-xs font-medium text-blue-700 border border-blue-200"
              >
                {c.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {connections.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-xs font-medium text-blue-600">
            발견된 연결 ({connections.length}개)
          </p>
          <div className="space-y-1">
            {connections.slice(0, 3).map((conn, i) => (
              <p key={i} className="text-xs text-blue-500">
                {conn.from_concept} → {conn.to_concept}
              </p>
            ))}
            {connections.length > 3 && (
              <p className="text-xs text-blue-400">
                +{connections.length - 3}개 더
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

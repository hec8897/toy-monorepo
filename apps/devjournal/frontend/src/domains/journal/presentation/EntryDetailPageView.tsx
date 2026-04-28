'use client';

import Link from 'next/link';

import {
  useGetEntry,
  useGetEntryConcepts,
  useJournalAnalysis,
  useRetryAnalysis,
} from '@/domains/journal/application';
import type { AnalysisState } from '@/domains/journal/application';

import { AnalysisProgressPanel } from './components/AnalysisProgressPanel';
import { EntryContent } from './components/EntryContent';
import { LearnedConceptsSection } from './components/LearnedConceptsSection';

interface EntryDetailPageViewProps {
  entryId: string;
}

export function EntryDetailPageView({ entryId }: EntryDetailPageViewProps) {
  const { data: entry, isLoading, isError } = useGetEntry(entryId);
  const { data: concepts, isLoading: isConceptsLoading } = useGetEntryConcepts(
    entryId,
    entry?.analysis_status,
  );
  const analysisState = useJournalAnalysis(entryId, entry?.analysis_status);
  const { mutate: retryAnalysis, isPending: isRetrying } =
    useRetryAnalysis(entryId);

  const isAnalyzing =
    entry?.analysis_status === 'pending' ||
    entry?.analysis_status === 'processing';
  const isFailed = entry?.analysis_status === 'failed';

  // 페이지 진입 시 SSE 없이 DB 에러를 fallback으로 표시
  const effectiveAnalysisState: AnalysisState = {
    ...analysisState,
    error:
      analysisState.error ??
      (isFailed ? (entry?.analysis_error ?? '분석에 실패했습니다.') : null),
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8 space-y-4">
        <div className="h-4 w-16 animate-pulse rounded bg-gray-100" />
        <div className="h-8 w-2/3 animate-pulse rounded bg-gray-100" />
        <div className="h-48 animate-pulse rounded bg-gray-100" />
      </div>
    );
  }

  if (isError || !entry) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="text-sm text-red-500">
          일기를 불러오는 중 오류가 발생했습니다.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-8 space-y-8">
      <Link
        href="/journal"
        className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors"
      >
        ← 목록으로
      </Link>

      <EntryContent entry={entry} />

      {(isAnalyzing || isFailed) && (
        <AnalysisProgressPanel
          analysisState={effectiveAnalysisState}
          onRetry={isFailed ? retryAnalysis : undefined}
          isRetrying={isRetrying}
        />
      )}

      {!isAnalyzing && !isFailed && (
        <LearnedConceptsSection
          status={entry.analysis_status}
          concepts={concepts}
          isLoading={isConceptsLoading}
        />
      )}
    </div>
  );
}

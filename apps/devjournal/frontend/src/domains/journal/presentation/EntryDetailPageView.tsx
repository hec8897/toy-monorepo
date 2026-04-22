'use client';

import Link from 'next/link';

import {
  useGetEntry,
  useGetEntryConcepts,
  useJournalAnalysis,
} from '@/domains/journal/application';

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

  const isAnalyzing =
    entry?.analysis_status === 'pending' ||
    entry?.analysis_status === 'processing';

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

      {/* 분석 진행 중: SSE 실시간 패널 */}
      {isAnalyzing && <AnalysisProgressPanel analysisState={analysisState} />}

      {/* 분석 완료: 개념 목록 */}
      {!isAnalyzing && (
        <LearnedConceptsSection
          status={entry.analysis_status}
          concepts={concepts}
          isLoading={isConceptsLoading}
        />
      )}
    </div>
  );
}

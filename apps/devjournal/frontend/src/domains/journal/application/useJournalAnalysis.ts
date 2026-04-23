'use client';

import { useEffect, useState } from 'react';

import { useQueryClient } from '@tanstack/react-query';

import type {
  AnalysisStatus,
  ConceptConnection,
  ExtractedConcept,
  SSEConceptsExtractedData,
  SSEConnectionsFoundData,
  SSEProgressData,
} from '@devjournal/types';

import { createClient } from '@/shared/lib/supabase';

import { journalQueryKeys } from './queryKeys';

export interface AnalysisState {
  /** 0: 시작 전, 1: 개념 추출 중, 2: 연결 분석 중 */
  currentStep: 0 | 1 | 2;
  concepts: ExtractedConcept[];
  connections: ConceptConnection[];
  isComplete: boolean;
  error: string | null;
}

const INITIAL_STATE: AnalysisState = {
  currentStep: 0,
  concepts: [],
  connections: [],
  isComplete: false,
  error: null,
};

/**
 * SSE EventSource를 통해 분석 진행 상황을 실시간으로 수신하는 훅.
 * - initialStatus가 completed/failed면 SSE 연결을 하지 않는다.
 * - analysis_complete 수신 시 entry/concepts 캐시를 무효화한다.
 */
export function useJournalAnalysis(
  entryId: string,
  initialStatus: AnalysisStatus | undefined,
): AnalysisState {
  const queryClient = useQueryClient();
  const [state, setState] = useState<AnalysisState>(INITIAL_STATE);

  useEffect(() => {
    if (!entryId || !initialStatus) return;
    if (initialStatus === 'completed' || initialStatus === 'failed') return;

    let es: EventSource | null = null;

    const connect = async () => {
      // EventSource는 커스텀 헤더 미지원 → token을 쿼리 파라미터로 전달
      const supabase = createClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) return;

      const url = `${process.env.NEXT_PUBLIC_API_URL ?? ''}/entries/${entryId}/analysis?token=${session.access_token}`;
      es = new EventSource(url);

      es.addEventListener('progress', (e: MessageEvent) => {
        const { step } = JSON.parse(e.data) as SSEProgressData;
        setState((prev) => ({ ...prev, currentStep: step as 1 | 2 }));
      });

      es.addEventListener('concepts_extracted', (e: MessageEvent) => {
        const { concepts } = JSON.parse(e.data) as SSEConceptsExtractedData;
        setState((prev) => ({ ...prev, concepts }));
      });

      es.addEventListener('connections_found', (e: MessageEvent) => {
        const { connections } = JSON.parse(e.data) as SSEConnectionsFoundData;
        setState((prev) => ({ ...prev, connections }));
      });

      es.addEventListener('analysis_complete', () => {
        setState((prev) => ({ ...prev, isComplete: true }));
        es?.close();
        void queryClient.invalidateQueries({
          queryKey: journalQueryKeys.detail(entryId),
        });
        void queryClient.invalidateQueries({
          queryKey: journalQueryKeys.concepts(entryId),
        });
      });

      es.addEventListener('error', (e: MessageEvent) => {
        let message = '분석 중 오류가 발생했습니다.';
        try {
          const data = JSON.parse(e.data) as { message?: string };
          if (data.message) message = data.message;
        } catch {
          /* ignore */
        }
        setState((prev) => ({ ...prev, error: message }));
        es?.close();
      });

      es.onerror = () => es?.close();
    };

    void connect();
    return () => es?.close();
  }, [entryId, initialStatus, queryClient]);

  return state;
}

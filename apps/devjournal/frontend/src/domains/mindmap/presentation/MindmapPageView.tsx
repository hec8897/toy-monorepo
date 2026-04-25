'use client';

import { useMindmapStore } from '@/domains/mindmap/application/mindmapStore';
import { useMindmapQuery } from '@/domains/mindmap/application/useMindmapQuery';

import { ConceptDetailDrawer } from './ConceptDetailDrawer';
import { MindmapCanvas } from './MindmapCanvas';
import { MindmapEmptyState } from './MindmapEmptyState';

export function MindmapPageView() {
  const { data, isLoading, error, refetch } = useMindmapQuery();
  const selectedConceptId = useMindmapStore((s) => s.selectedConceptId);
  const selectConcept = useMindmapStore((s) => s.selectConcept);

  return (
    <div className="relative h-[calc(100dvh-3rem)] md:h-dvh">
      <header className="absolute left-0 top-0 z-10 px-6 py-4">
        <h1 className="text-xl font-semibold text-gray-900">🗺️ 마인드맵</h1>
        <p className="text-xs text-gray-500">
          내가 학습한 개념과 그 연결을 한눈에
        </p>
      </header>

      {isLoading && (
        <div className="flex h-full items-center justify-center text-sm text-gray-400">
          마인드맵을 불러오는 중...
        </div>
      )}

      {error && (
        <div className="flex h-full flex-col items-center justify-center gap-3 text-sm text-gray-500">
          <p>마인드맵을 불러오지 못했어요.</p>
          <button
            type="button"
            onClick={() => refetch()}
            className="rounded-md border border-gray-200 px-3 py-1 text-sm hover:bg-gray-50"
          >
            다시 시도
          </button>
        </div>
      )}

      {data && data.nodes.length === 0 && <MindmapEmptyState />}

      {data && data.nodes.length > 0 && (
        <MindmapCanvas
          nodes={data.nodes}
          edges={data.edges}
          selectedConceptId={selectedConceptId}
          onSelectConcept={selectConcept}
        />
      )}

      <ConceptDetailDrawer
        conceptId={selectedConceptId}
        onClose={() => selectConcept(null)}
      />
    </div>
  );
}

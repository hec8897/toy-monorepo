'use client';

import { useEffect } from 'react';

import Link from 'next/link';

import { useConceptDetailQuery } from '@/domains/mindmap/application/useConceptDetailQuery';
import { getCategoryColor } from '@/domains/mindmap/domain/categoryColors';

interface Props {
  conceptId: string | null;
  onClose: () => void;
}

const MASTERY_LABEL: Record<'learning' | 'familiar' | 'mastered', string> = {
  learning: '학습 중',
  familiar: '익숙함',
  mastered: '숙달함',
};

export function ConceptDetailDrawer({ conceptId, onClose }: Props) {
  const { data, isLoading, error } = useConceptDetailQuery(conceptId);

  useEffect(() => {
    if (!conceptId) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [conceptId, onClose]);

  return (
    <aside
      className={`fixed right-0 top-0 z-30 flex h-dvh w-[380px] max-w-full flex-col border-l border-gray-200 bg-white shadow-xl transition-transform duration-200 ${
        conceptId ? 'translate-x-0' : 'translate-x-full'
      }`}
      aria-hidden={!conceptId}
    >
      {conceptId && (
        <>
          <header className="flex items-start justify-between border-b border-gray-100 px-5 py-4">
            <div>
              {isLoading && (
                <p className="text-sm text-gray-400">불러오는 중...</p>
              )}
              {data && (
                <>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {data.name}
                  </h2>
                  <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                    <span
                      className="inline-flex h-2 w-2 rounded-full"
                      style={{
                        backgroundColor: getCategoryColor(data.category),
                      }}
                    />
                    <span>{data.category}</span>
                    <span>·</span>
                    <span>{MASTERY_LABEL[data.mastery]}</span>
                  </div>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="ml-2 rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              aria-label="닫기"
            >
              ✕
            </button>
          </header>

          <div className="flex-1 overflow-auto px-5 py-4">
            {error && (
              <p className="text-sm text-red-500">개념을 불러오지 못했어요.</p>
            )}

            {data && (
              <>
                <section className="mb-4 flex items-center gap-2 text-sm text-gray-600">
                  <span>📖</span>
                  <span>{data.review_count}회 학습</span>
                </section>

                {data.description && (
                  <section className="mb-5">
                    <p className="text-sm leading-relaxed text-gray-700">
                      {data.description}
                    </p>
                  </section>
                )}

                <section>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    📝 관련 일기 ({data.related_entries.length})
                  </p>
                  {data.related_entries.length === 0 ? (
                    <p className="text-sm text-gray-400">
                      이 개념이 추출된 일기가 없어요.
                    </p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {data.related_entries.map((entry) => (
                        <li key={entry.id}>
                          <Link
                            href={`/journal/${entry.id}`}
                            className="block rounded-md px-2 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            onClick={onClose}
                          >
                            <span className="block truncate">
                              {entry.title?.trim() || '(제목 없음)'}
                            </span>
                            <span className="text-xs text-gray-400">
                              {new Date(entry.created_at).toLocaleDateString(
                                'ko-KR',
                              )}
                            </span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </>
            )}
          </div>
        </>
      )}
    </aside>
  );
}

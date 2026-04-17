'use client';

import Link from 'next/link';

import {
  getAnalysisStatusBadgeStyle,
  getAnalysisStatusLabel,
  type Entry,
} from '@/domains/journal/domain/entry';

interface JournalListProps {
  entries: Entry[];
  isLoading: boolean;
  isError: boolean;
  onDelete: (id: string) => void;
  deletingId: string | undefined;
}

export function JournalList({
  entries,
  isLoading,
  isError,
  onDelete,
  deletingId,
}: JournalListProps) {
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
    return (
      <p className="text-sm text-red-500">
        목록을 불러오는 중 오류가 발생했습니다.
      </p>
    );
  }

  if (entries.length === 0) {
    return (
      <p className="text-sm text-gray-400">아직 작성한 일기가 없습니다.</p>
    );
  }

  return (
    <ul className="space-y-3">
      {entries.map((entry) => (
        <li
          key={entry.id}
          className="flex items-start justify-between rounded-md border border-gray-200 p-4"
        >
          <Link
            href={`/journal/${entry.id}`}
            className="min-w-0 flex-1 hover:opacity-80"
          >
            <p className="truncate text-sm font-medium text-gray-900">
              {entry.title ?? entry.content.slice(0, 50)}
            </p>
            <div className="mt-1 flex items-center gap-2">
              <span className="text-xs text-gray-400">
                {new Date(entry.created_at).toLocaleDateString('ko-KR')}
              </span>
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${getAnalysisStatusBadgeStyle(entry.analysis_status)}`}
              >
                {getAnalysisStatusLabel(entry.analysis_status)}
              </span>
            </div>
          </Link>
          <button
            onClick={() => {
              if (window.confirm('정말 삭제하시겠어요?')) {
                onDelete(entry.id);
              }
            }}
            disabled={deletingId === entry.id}
            className="ml-4 shrink-0 text-xs text-red-400 hover:text-red-600 disabled:opacity-40"
          >
            삭제
          </button>
        </li>
      ))}
    </ul>
  );
}

import {
  getAnalysisStatusBadgeStyle,
  getAnalysisStatusLabel,
  type Entry,
} from '@/domains/journal/domain/entry';

interface EntryContentProps {
  entry: Entry;
}

export function EntryContent({ entry }: EntryContentProps) {
  return (
    <div className="space-y-6">
      {/* 헤더 */}
      <div className="space-y-2">
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {entry.title ?? '제목 없음'}
        </h1>
        <div className="flex items-center gap-3">
          <span className="text-xs text-gray-400">
            {new Date(entry.created_at).toLocaleString('ko-KR')}
          </span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${getAnalysisStatusBadgeStyle(entry.analysis_status)}`}
          >
            {getAnalysisStatusLabel(entry.analysis_status)}
          </span>
        </div>
      </div>

      {/* AI 요약 */}
      {entry.summary && (
        <div className="border-l-4 border-blue-400 pl-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-400">
            AI Summary
          </p>
          <p className="mt-1 text-sm leading-relaxed text-gray-600">
            {entry.summary}
          </p>
        </div>
      )}

      {/* 본문 */}
      <p className="whitespace-pre-wrap text-sm leading-7 text-gray-700">
        {entry.content}
      </p>
    </div>
  );
}

'use client';

interface Props {
  onZoomFit: () => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

export function MindmapToolbar({ onZoomFit, onRefresh, isRefreshing }: Props) {
  return (
    <div className="absolute right-4 top-4 z-20 flex gap-2">
      <button
        type="button"
        onClick={onZoomFit}
        className="rounded-md border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-gray-50"
        title="전체 보기"
      >
        🔍 전체 보기
      </button>
      <button
        type="button"
        onClick={onRefresh}
        disabled={isRefreshing}
        className="rounded-md border border-gray-200 bg-white/90 px-3 py-1.5 text-xs font-medium text-gray-700 shadow-sm backdrop-blur-sm hover:bg-gray-50 disabled:opacity-50"
        title="새로고침"
      >
        {isRefreshing ? '⏳ 불러오는 중' : '🔄 새로고침'}
      </button>
    </div>
  );
}

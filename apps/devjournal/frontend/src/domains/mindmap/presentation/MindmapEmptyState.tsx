import Link from 'next/link';

export function MindmapEmptyState() {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 p-12 text-center">
      <span className="text-5xl" aria-hidden>
        🗺️
      </span>
      <p className="text-lg font-semibold text-gray-900">
        아직 학습한 개념이 없어요
      </p>
      <p className="max-w-sm text-sm text-gray-500">
        일기를 작성하면 AI가 자동으로 개념을 추출해 당신만의 학습 지도를
        만들어줍니다.
      </p>
      <Link
        href="/journal"
        className="mt-2 inline-flex items-center gap-2 rounded-md bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700"
      >
        ✏️ 일기 쓰러 가기
      </Link>
    </div>
  );
}

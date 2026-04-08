import type { AnalysisStatus } from '@devjournal/types';

export type { Entry, AnalysisStatus } from '@devjournal/types';

export type CreateEntryInput = {
  content: string;
  title?: string;
};

export const ENTRY_CONTENT_MIN_LENGTH = 10;

export function isValidEntryContent(content: string): boolean {
  return content.trim().length >= ENTRY_CONTENT_MIN_LENGTH;
}

export function getAnalysisStatusLabel(status: AnalysisStatus): string {
  const labels: Record<AnalysisStatus, string> = {
    pending: '대기 중',
    processing: '분석 중',
    completed: '완료',
    failed: '실패',
  };
  return labels[status];
}

export function getAnalysisStatusBadgeStyle(status: AnalysisStatus): string {
  const styles: Record<AnalysisStatus, string> = {
    pending: 'bg-gray-100 text-gray-600',
    processing: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600',
  };
  return styles[status];
}

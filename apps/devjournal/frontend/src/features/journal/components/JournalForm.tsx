'use client';

import { useState } from 'react';

import type { CreateEntryInput } from '../types';

interface JournalFormProps {
  onSubmit: (data: CreateEntryInput) => void;
  isPending: boolean;
}

export function JournalForm({ onSubmit, isPending }: JournalFormProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const isDisabled = content.length < 10 || isPending;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (isDisabled) return;
    onSubmit({ content, title: title || undefined });
    setTitle('');
    setContent('');
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <input
        type="text"
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <textarea
        placeholder="오늘 배운 것을 기록하세요 (최소 10자)"
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={6}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{content.length}자</span>
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState } from 'react';

import {
  ENTRY_CONTENT_MIN_LENGTH,
  type CreateEntryInput,
} from '@/domains/journal/domain/entry';

import { TiptapEditor } from './TiptapEditor';

interface JournalFormProps {
  onSubmit: (data: CreateEntryInput) => void;
  isPending: boolean;
}

export function JournalForm({ onSubmit, isPending }: JournalFormProps) {
  const [title, setTitle] = useState('');
  const [markdown, setMarkdown] = useState('');
  const [plainLength, setPlainLength] = useState(0);

  const isDisabled = plainLength < ENTRY_CONTENT_MIN_LENGTH || isPending;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (isDisabled) return;
        onSubmit({ content: markdown, title: title || undefined });
        setTitle('');
        setMarkdown('');
        setPlainLength(0);
      }}
      className="space-y-3"
    >
      <input
        type="text"
        placeholder="제목 (선택)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <TiptapEditor
        markdown={markdown}
        onChange={(md, text) => {
          setMarkdown(md);
          setPlainLength(text.length);
        }}
        placeholder={`오늘 배운 것을 기록하세요 (최소 ${ENTRY_CONTENT_MIN_LENGTH}자)`}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">{plainLength}자</span>
        <button
          type="submit"
          disabled={isDisabled}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {isPending ? '저장 중...' : '저장'}
        </button>
      </div>
    </form>
  );
}

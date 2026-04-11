'use client';

import { useEffect, useState } from 'react';

interface ConceptSearchProps {
  value: string;
  onChange: (v: string) => void;
}

export function ConceptSearch({ value, onChange }: ConceptSearchProps) {
  const [inputValue, setInputValue] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      onChange(inputValue);
    }, 300);

    return () => clearTimeout(timer);
  }, [inputValue, onChange]);

  useEffect(() => {
    setInputValue(value);
  }, [value]);

  return (
    <input
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      placeholder="개념 검색..."
      className="w-full rounded-md border border-gray-200 px-3 py-2 text-sm placeholder-gray-400 focus:border-gray-400 focus:outline-none"
    />
  );
}

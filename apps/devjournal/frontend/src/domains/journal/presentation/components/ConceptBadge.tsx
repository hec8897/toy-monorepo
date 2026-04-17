import type { ConceptCategory } from '@devjournal/types';

const categoryStyles: Record<ConceptCategory, string> = {
  language: 'bg-blue-100 text-blue-700',
  framework: 'bg-purple-100 text-purple-700',
  pattern: 'bg-yellow-100 text-yellow-700',
  principle: 'bg-green-100 text-green-700',
  tool: 'bg-orange-100 text-orange-700',
  concept: 'bg-gray-100 text-gray-700',
  algorithm: 'bg-red-100 text-red-700',
  database: 'bg-cyan-100 text-cyan-700',
  devops: 'bg-indigo-100 text-indigo-700',
  other: 'bg-gray-100 text-gray-500',
};

interface ConceptBadgeProps {
  name: string;
  category: ConceptCategory;
  description?: string | null;
}

export function ConceptBadge({
  name,
  category,
  description,
}: ConceptBadgeProps) {
  return (
    <span
      title={description ?? undefined}
      className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${categoryStyles[category]}`}
    >
      {name}
    </span>
  );
}

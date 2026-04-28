export const CATEGORY_COLORS: Record<string, string> = {
  language: '#0ea5e9',
  framework: '#6366f1',
  pattern: '#8b5cf6',
  principle: '#ec4899',
  tool: '#f59e0b',
  concept: '#10b981',
  algorithm: '#f43f5e',
  database: '#06b6d4',
  devops: '#f97316',
  other: '#94a3b8',
};

const FALLBACK_COLOR = '#94a3b8';

export function getCategoryColor(category: string): string {
  return CATEGORY_COLORS[category] ?? FALLBACK_COLOR;
}

const MASTERY_OPACITY = {
  learning: 0.5,
  familiar: 0.75,
  mastered: 1,
} as const;

export function getMasteryOpacity(
  mastery: 'learning' | 'familiar' | 'mastered',
): number {
  return MASTERY_OPACITY[mastery];
}

export function getNodeRadius(reviewCount: number): number {
  const safe = Math.max(0, reviewCount);
  return 8 + Math.log(safe + 1) * 4;
}

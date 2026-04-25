'use client';

import type { SimLink } from '@/domains/mindmap/application/useMindmapSimulation';

interface Props {
  link: SimLink;
}

export function MindmapEdgeView({ link }: Props) {
  const source = link.source as { x?: number; y?: number };
  const target = link.target as { x?: number; y?: number };

  if (
    source.x === undefined ||
    source.y === undefined ||
    target.x === undefined ||
    target.y === undefined
  ) {
    return null;
  }

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke="#94a3b8"
      strokeWidth={1 + link.strength * 2}
      strokeOpacity={0.6}
    />
  );
}

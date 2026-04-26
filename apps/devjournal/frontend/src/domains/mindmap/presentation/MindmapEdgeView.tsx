'use client';

import type { SimLink } from '@/domains/mindmap/application/useMindmapSimulation';

interface Props {
  link: SimLink;
  isFaded: boolean;
  isEmphasized: boolean;
  onHover: (key: string | null) => void;
  edgeKey: string;
}

export function MindmapEdgeView({
  link,
  isFaded,
  isEmphasized,
  onHover,
  edgeKey,
}: Props) {
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

  const opacity = isFaded ? 0.05 : isEmphasized ? 0.95 : 0.5;
  const strokeWidth = (1 + link.strength * 2) * (isEmphasized ? 1.5 : 1);

  return (
    <line
      x1={source.x}
      y1={source.y}
      x2={target.x}
      y2={target.y}
      stroke="#94a3b8"
      strokeWidth={strokeWidth}
      strokeOpacity={opacity}
      style={{ transition: 'stroke-opacity 200ms ease' }}
      onMouseEnter={() => onHover(edgeKey)}
      onMouseLeave={() => onHover(null)}
      pointerEvents="stroke"
    />
  );
}

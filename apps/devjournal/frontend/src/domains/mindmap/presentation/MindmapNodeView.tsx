'use client';

import { useEffect, useRef } from 'react';

import type { SimNode } from '@/domains/mindmap/application/useMindmapSimulation';
import {
  getCategoryColor,
  getMasteryOpacity,
} from '@/domains/mindmap/domain/categoryColors';

interface Props {
  node: SimNode;
  isSelected: boolean;
  isFaded: boolean;
  isEmphasized: boolean;
  onClick: () => void;
  onHover: (id: string | null) => void;
  attachDrag: (element: SVGCircleElement | null, node: SimNode) => void;
}

export function MindmapNodeView({
  node,
  isSelected,
  isFaded,
  isEmphasized,
  onClick,
  onHover,
  attachDrag,
}: Props) {
  const circleRef = useRef<SVGCircleElement>(null);

  useEffect(() => {
    attachDrag(circleRef.current, node);
  }, [attachDrag, node]);

  if (node.x === undefined || node.y === undefined) return null;

  const isRecent = node.is_recent;
  const stroke = isSelected ? '#0f172a' : isRecent ? '#f59e0b' : '#fff';
  const strokeWidth = isEmphasized || isSelected || isRecent ? 4 : 2;
  const opacity = isFaded ? 0.15 : 1;

  return (
    <g style={{ cursor: 'pointer', opacity, transition: 'opacity 200ms ease' }}>
      <circle
        ref={circleRef}
        cx={node.x}
        cy={node.y}
        r={node.radius}
        fill={getCategoryColor(node.category)}
        fillOpacity={getMasteryOpacity(node.mastery)}
        stroke={stroke}
        strokeWidth={strokeWidth}
        onClick={onClick}
        onMouseEnter={() => onHover(node.id)}
        onMouseLeave={() => onHover(null)}
        className={isRecent ? 'mindmap-node-pulse' : undefined}
      />
      <text
        x={node.x + node.radius + 4}
        y={node.y + 4}
        fontSize={12}
        fill="#1f2937"
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        {node.name}
      </text>
    </g>
  );
}

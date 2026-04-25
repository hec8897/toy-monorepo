'use client';

import { useEffect, useRef, useState } from 'react';

import type { SimNode } from '@/domains/mindmap/application/useMindmapSimulation';
import {
  getCategoryColor,
  getMasteryOpacity,
} from '@/domains/mindmap/domain/categoryColors';

interface Props {
  node: SimNode;
  isSelected: boolean;
  onClick: () => void;
  attachDrag: (element: SVGCircleElement | null, node: SimNode) => void;
}

export function MindmapNodeView({
  node,
  isSelected,
  onClick,
  attachDrag,
}: Props) {
  const circleRef = useRef<SVGCircleElement>(null);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    attachDrag(circleRef.current, node);
  }, [attachDrag, node]);

  if (node.x === undefined || node.y === undefined) return null;

  const stroke = isSelected ? '#0f172a' : '#fff';
  const strokeWidth = isHovered || isSelected ? 4 : 2;

  return (
    <g style={{ cursor: 'pointer' }}>
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
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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

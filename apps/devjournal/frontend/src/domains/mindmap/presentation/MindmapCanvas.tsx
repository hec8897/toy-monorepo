'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';

import { select, zoom as d3Zoom, ZoomTransform } from 'd3';

import type { MyMindmapEdge, MyMindmapNode } from '@devjournal/types';

import { useMindmapSimulation } from '@/domains/mindmap/application/useMindmapSimulation';

import { MindmapEdgeView } from './MindmapEdgeView';
import { MindmapNodeView } from './MindmapNodeView';

interface Props {
  nodes: MyMindmapNode[];
  edges: MyMindmapEdge[];
  selectedConceptId: string | null;
  onSelectConcept: (id: string) => void;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 4;

export function MindmapCanvas({
  nodes,
  edges,
  selectedConceptId,
  onSelectConcept,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  // 컨테이너 크기 측정
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const measure = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    measure();

    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // d3.zoom 적용
  useEffect(() => {
    const svg = svgRef.current;
    if (!svg) return;

    const zoomBehavior = d3Zoom<SVGSVGElement, unknown>()
      .scaleExtent([ZOOM_MIN, ZOOM_MAX])
      .filter((event: Event) => {
        // 드래그 가능한 노드 위에서는 zoom의 패닝 동작을 막아 충돌 방지
        const target = event.target as SVGElement | null;
        if (event.type === 'mousedown' && target?.tagName === 'circle') {
          return false;
        }
        return !(event as MouseEvent).button;
      })
      .on('zoom', (event: { transform: ZoomTransform }) => {
        setTransform({
          x: event.transform.x,
          y: event.transform.y,
          k: event.transform.k,
        });
      });

    select(svg).call(zoomBehavior);
  }, []);

  const { positionedNodes, positionedLinks, attachDrag } = useMindmapSimulation(
    {
      nodes,
      edges,
      width: size.width,
      height: size.height,
    },
  );

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="bg-white"
      >
        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {positionedLinks.map((link, i) => (
            <MindmapEdgeView
              key={`${typeof link.source === 'string' ? link.source : link.source.id}-${typeof link.target === 'string' ? link.target : link.target.id}-${i}`}
              link={link}
            />
          ))}
          {positionedNodes.map((node) => (
            <MindmapNodeView
              key={node.id}
              node={node}
              isSelected={selectedConceptId === node.id}
              onClick={() => onSelectConcept(node.id)}
              attachDrag={attachDrag}
            />
          ))}
        </g>
      </svg>
    </div>
  );
}

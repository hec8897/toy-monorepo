'use client';

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { select, zoom as d3Zoom, ZoomTransform } from 'd3';

import type { MyMindmapEdge, MyMindmapNode } from '@devjournal/types';

import { useMindmapStore } from '@/domains/mindmap/application/mindmapStore';
import {
  type SimLink,
  useMindmapSimulation,
} from '@/domains/mindmap/application/useMindmapSimulation';

import { MindmapEdgeView } from './MindmapEdgeView';
import { MindmapNodeView } from './MindmapNodeView';
import { MindmapToolbar } from './MindmapToolbar';

interface Props {
  nodes: MyMindmapNode[];
  edges: MyMindmapEdge[];
  selectedConceptId: string | null;
  onSelectConcept: (id: string) => void;
  onRefresh: () => void;
  isRefreshing: boolean;
}

const ZOOM_MIN = 0.3;
const ZOOM_MAX = 4;
const ZOOM_FIT_PADDING = 60;

const linkKey = (link: SimLink): string => {
  const sourceId =
    typeof link.source === 'string' ? link.source : link.source.id;
  const targetId =
    typeof link.target === 'string' ? link.target : link.target.id;
  return `${sourceId}-${targetId}`;
};

export function MindmapCanvas({
  nodes,
  edges,
  selectedConceptId,
  onSelectConcept,
  onRefresh,
  isRefreshing,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const zoomRef = useRef<ReturnType<
    typeof d3Zoom<SVGSVGElement, unknown>
  > | null>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });

  const hoveredNodeId = useMindmapStore((s) => s.hoveredNodeId);
  const setHovered = useMindmapStore((s) => s.setHovered);
  const hoveredEdgeKey = useMindmapStore((s) => s.hoveredEdgeKey);
  const setHoveredEdge = useMindmapStore((s) => s.setHoveredEdge);

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
    zoomRef.current = zoomBehavior;
  }, []);

  const { positionedNodes, positionedLinks, attachDrag, getNodes } =
    useMindmapSimulation({
      nodes,
      edges,
      width: size.width,
      height: size.height,
    });

  // hover 시 1-hop 이웃 Set 계산
  const neighbors = useMemo(() => {
    if (!hoveredNodeId) return null;
    const set = new Set<string>([hoveredNodeId]);
    for (const e of edges) {
      if (e.from === hoveredNodeId) set.add(e.to);
      if (e.to === hoveredNodeId) set.add(e.from);
    }
    return set;
  }, [hoveredNodeId, edges]);

  // 호버 엣지 메타 (라벨 표시용)
  const hoveredEdge = useMemo(() => {
    if (!hoveredEdgeKey) return null;
    return positionedLinks.find((l) => linkKey(l) === hoveredEdgeKey) ?? null;
  }, [hoveredEdgeKey, positionedLinks]);

  // 줌-fit: 노드 bounding box → svg 화면에 들어가도록 transform 적용
  const handleZoomFit = () => {
    if (!svgRef.current || !zoomRef.current) return;
    const nodeList = getNodes().filter(
      (n) => typeof n.x === 'number' && typeof n.y === 'number',
    );
    if (nodeList.length === 0) return;

    const xs = nodeList.map((n) => n.x ?? 0);
    const ys = nodeList.map((n) => n.y ?? 0);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);

    const w = maxX - minX || 1;
    const h = maxY - minY || 1;
    const scale = Math.min(
      (size.width - ZOOM_FIT_PADDING * 2) / w,
      (size.height - ZOOM_FIT_PADDING * 2) / h,
      ZOOM_MAX,
    );
    const tx = size.width / 2 - ((minX + maxX) / 2) * scale;
    const ty = size.height / 2 - ((minY + maxY) / 2) * scale;

    select(svgRef.current)
      .transition()
      .duration(500)
      .call(zoomRef.current.transform, new ZoomTransform(scale, tx, ty));
  };

  return (
    <div ref={containerRef} className="relative h-full w-full overflow-hidden">
      <svg
        ref={svgRef}
        width={size.width}
        height={size.height}
        className="bg-white"
        onClick={(e) => {
          // 빈 곳 클릭 시 호버 해제
          if (e.target === svgRef.current) setHovered(null);
        }}
      >
        <g
          transform={`translate(${transform.x},${transform.y}) scale(${transform.k})`}
        >
          {positionedLinks.map((link, i) => {
            const key = linkKey(link);
            const sourceId =
              typeof link.source === 'string' ? link.source : link.source.id;
            const targetId =
              typeof link.target === 'string' ? link.target : link.target.id;
            const isFaded =
              !!neighbors &&
              !(neighbors.has(sourceId) && neighbors.has(targetId));
            const isEmphasized = hoveredEdgeKey === key;
            return (
              <MindmapEdgeView
                key={`${key}-${i}`}
                link={link}
                isFaded={isFaded}
                isEmphasized={isEmphasized}
                onHover={setHoveredEdge}
                edgeKey={key}
              />
            );
          })}
          {positionedNodes.map((node) => {
            const isFaded = !!neighbors && !neighbors.has(node.id);
            const isEmphasized = hoveredNodeId === node.id;
            return (
              <MindmapNodeView
                key={node.id}
                node={node}
                isSelected={selectedConceptId === node.id}
                isFaded={isFaded}
                isEmphasized={isEmphasized}
                onClick={() => onSelectConcept(node.id)}
                onHover={setHovered}
                attachDrag={attachDrag}
              />
            );
          })}
        </g>
      </svg>

      <MindmapToolbar
        onZoomFit={handleZoomFit}
        onRefresh={onRefresh}
        isRefreshing={isRefreshing}
      />

      {hoveredEdge && (
        <HoverEdgeLabel link={hoveredEdge} transform={transform} />
      )}
    </div>
  );
}

interface HoverEdgeLabelProps {
  link: SimLink;
  transform: { x: number; y: number; k: number };
}

function HoverEdgeLabel({ link, transform }: HoverEdgeLabelProps) {
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
  const midX = (source.x + target.x) / 2;
  const midY = (source.y + target.y) / 2;
  const screenX = midX * transform.k + transform.x;
  const screenY = midY * transform.k + transform.y;

  return (
    <div
      className="pointer-events-none absolute z-20 -translate-x-1/2 -translate-y-1/2 rounded-md bg-gray-900/90 px-2 py-1 text-xs text-white shadow"
      style={{ left: screenX, top: screenY }}
    >
      <div className="font-medium">{link.type}</div>
      <div className="text-[10px] text-gray-300">
        강도 {link.strength.toFixed(2)}
      </div>
    </div>
  );
}

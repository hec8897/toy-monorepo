'use client';

import { useEffect, useRef, useState } from 'react';

import {
  drag as d3Drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
  forceX,
  forceY,
  select,
  Simulation,
  SimulationLinkDatum,
  SimulationNodeDatum,
} from 'd3';

import type { MyMindmapEdge, MyMindmapNode } from '@devjournal/types';

import { getNodeRadius } from '@/domains/mindmap/domain/categoryColors';

export interface SimNode extends SimulationNodeDatum, MyMindmapNode {
  radius: number;
}

export interface SimLink extends SimulationLinkDatum<SimNode> {
  source: string | SimNode;
  target: string | SimNode;
  strength: number;
  type: string;
}

interface UseMindmapSimulationParams {
  nodes: MyMindmapNode[];
  edges: MyMindmapEdge[];
  width: number;
  height: number;
}

interface UseMindmapSimulationResult {
  positionedNodes: SimNode[];
  positionedLinks: SimLink[];
  attachDrag: (element: SVGCircleElement | null, node: SimNode) => void;
  /** 캔버스 줌-fit 등에서 노드 좌표를 직접 읽어야 할 때 */
  getNodes: () => SimNode[];
  /** 시뮬레이션 reheat (zoom-fit 후 안정화 등) */
  reheat: (alpha?: number) => void;
}

// 데스크탑 (≥640px)
const DESKTOP = {
  charge: -150,
  collidePadding: 8,
  linkDistanceBase: 100,
  linkDistanceRange: 140,
  centerStrength: 0, // forceX/Y 비활성 — forceCenter만 사용
};

// 모바일 (<640px) — 좁은 화면에 노드들이 가운데 모이도록
const MOBILE = {
  charge: -80,
  collidePadding: 4,
  linkDistanceBase: 50,
  linkDistanceRange: 70,
  centerStrength: 0.08, // forceX/Y로 가운데 약한 끌어당김 (외곽 이탈 방지)
};

const MOBILE_BREAKPOINT_PX = 640;
const REHEAT_ALPHA = 0.3;

function getForceParams(width: number): typeof DESKTOP {
  return width < MOBILE_BREAKPOINT_PX ? MOBILE : DESKTOP;
}

/**
 * 시뮬레이션에 force들을 적용/갱신.
 * 마운트와 update 케이스 모두에서 동일하게 호출되어 파라미터 동기화 누락을 방지.
 */
function applyForces(
  simulation: Simulation<SimNode, SimLink>,
  params: typeof DESKTOP,
  width: number,
  height: number,
  links: SimLink[],
): void {
  simulation
    .force(
      'link',
      forceLink<SimNode, SimLink>(links)
        .id((d) => d.id)
        .distance(
          (link) =>
            params.linkDistanceBase +
            (1 - link.strength) * params.linkDistanceRange,
        ),
    )
    .force('charge', forceManyBody<SimNode>().strength(params.charge))
    .force('center', forceCenter<SimNode>(width / 2, height / 2))
    .force(
      'collide',
      forceCollide<SimNode>().radius((d) => d.radius + params.collidePadding),
    )
    .force('x', forceX<SimNode>(width / 2).strength(params.centerStrength))
    .force('y', forceY<SimNode>(height / 2).strength(params.centerStrength));
}

/**
 * D3 force-directed 시뮬레이션 훅.
 * - simulation 인스턴스를 한 번만 만들고, nodes/edges prop이 바뀌면 nodes()/links() 업데이트만.
 * - 기존 SimNode 좌표/fx/fy 보존 → 사용자 드래그 위치, 안정화된 위치가 머지 후에도 유지.
 * - 새 노드는 이웃 노드 좌표 평균에서 등장하여 자연스럽게 자리 잡음.
 */
export function useMindmapSimulation({
  nodes,
  edges,
  width,
  height,
}: UseMindmapSimulationParams): UseMindmapSimulationResult {
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const nodesMapRef = useRef<Map<string, SimNode>>(new Map());
  const linksRef = useRef<SimLink[]>([]);
  const [, setTick] = useState(0);

  // nodes/edges/size 변경 시 simulation 동기화
  useEffect(() => {
    if (width <= 0 || height <= 0) return;

    const map = nodesMapRef.current;
    const incomingIds = new Set(nodes.map((n) => n.id));

    // 사라진 노드 제거
    for (const id of Array.from(map.keys())) {
      if (!incomingIds.has(id)) map.delete(id);
    }

    // 새/업데이트 노드 반영
    for (const n of nodes) {
      const existing = map.get(n.id);
      if (existing) {
        // 메타만 업데이트, 좌표/fx/fy/vx/vy 유지
        existing.name = n.name;
        existing.category = n.category;
        existing.mastery = n.mastery;
        existing.review_count = n.review_count;
        existing.is_recent = n.is_recent;
        existing.radius = getNodeRadius(n.review_count);
      } else {
        // 신규 노드: 이웃 노드 좌표 평균에서 출발
        const neighborIds: string[] = [];
        for (const e of edges) {
          if (e.from === n.id) neighborIds.push(e.to);
          else if (e.to === n.id) neighborIds.push(e.from);
        }
        const neighborNodes = neighborIds
          .map((id) => map.get(id))
          .filter(
            (sn): sn is SimNode =>
              !!sn && typeof sn.x === 'number' && typeof sn.y === 'number',
          );

        const initialX =
          neighborNodes.length > 0
            ? neighborNodes.reduce((sum, sn) => sum + (sn.x ?? 0), 0) /
              neighborNodes.length
            : width / 2 + (Math.random() - 0.5) * 60;
        const initialY =
          neighborNodes.length > 0
            ? neighborNodes.reduce((sum, sn) => sum + (sn.y ?? 0), 0) /
              neighborNodes.length
            : height / 2 + (Math.random() - 0.5) * 60;

        map.set(n.id, {
          ...n,
          radius: getNodeRadius(n.review_count),
          x: initialX,
          y: initialY,
        });
      }
    }

    const simNodes = Array.from(map.values());

    // simLinks 재생성 (양 끝점이 map에 있는 경우만)
    const simLinks: SimLink[] = edges
      .filter((e) => map.has(e.from) && map.has(e.to))
      .map((e) => ({
        source: map.get(e.from) as SimNode,
        target: map.get(e.to) as SimNode,
        strength: e.strength,
        type: e.type,
      }));
    linksRef.current = simLinks;

    const params = getForceParams(width);

    if (!simulationRef.current) {
      // 첫 마운트
      const simulation = forceSimulation<SimNode, SimLink>(simNodes).on(
        'tick',
        () => setTick((t) => t + 1),
      );
      applyForces(simulation, params, width, height, simLinks);
      simulationRef.current = simulation;
    } else {
      // 업데이트 — width 변경 시 모바일/데스크탑 전환 대응
      const simulation = simulationRef.current;
      simulation.nodes(simNodes);
      applyForces(simulation, params, width, height, simLinks);
      simulation.alpha(REHEAT_ALPHA).restart();
    }
  }, [nodes, edges, width, height]);

  // 언마운트 시 정리
  useEffect(() => {
    return () => {
      simulationRef.current?.stop();
      simulationRef.current = null;
      nodesMapRef.current.clear();
      linksRef.current = [];
    };
  }, []);

  const attachDrag = (
    element: SVGCircleElement | null,
    node: SimNode,
  ): void => {
    if (!element || !simulationRef.current) return;
    const simulation = simulationRef.current;

    const dragBehavior = d3Drag<SVGCircleElement, unknown>()
      .on('start', (event) => {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        node.fx = node.x;
        node.fy = node.y;
      })
      .on('drag', (event) => {
        node.fx = event.x;
        node.fy = event.y;
      })
      .on('end', (event) => {
        if (!event.active) simulation.alphaTarget(0);
        node.fx = null;
        node.fy = null;
      });

    select(element).call(dragBehavior);
  };

  return {
    positionedNodes: Array.from(nodesMapRef.current.values()),
    positionedLinks: linksRef.current,
    attachDrag,
    getNodes: () => Array.from(nodesMapRef.current.values()),
    reheat: (alpha = REHEAT_ALPHA) =>
      simulationRef.current?.alpha(alpha).restart(),
  };
}

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

import {
  drag as d3Drag,
  forceCenter,
  forceCollide,
  forceLink,
  forceManyBody,
  forceSimulation,
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
}

const CHARGE_STRENGTH = -150;
const COLLIDE_PADDING = 4;
const LINK_DISTANCE_BASE = 50;
const LINK_DISTANCE_RANGE = 100;

export function useMindmapSimulation({
  nodes,
  edges,
  width,
  height,
}: UseMindmapSimulationParams): UseMindmapSimulationResult {
  const simulationRef = useRef<Simulation<SimNode, SimLink> | null>(null);
  const [tick, setTick] = useState(0);

  // 입력 nodes/edges → SimNode/SimLink 변환 (참조 유지)
  const { simNodes, simLinks } = useMemo(() => {
    const simNodes: SimNode[] = nodes.map((n) => ({
      ...n,
      radius: getNodeRadius(n.review_count),
    }));
    const idToSimNode = new Map(simNodes.map((n) => [n.id, n]));

    const simLinks: SimLink[] = edges
      .filter((e) => idToSimNode.has(e.from) && idToSimNode.has(e.to))
      .map((e) => ({
        source: idToSimNode.get(e.from) as SimNode,
        target: idToSimNode.get(e.to) as SimNode,
        strength: e.strength,
        type: e.type,
      }));

    return { simNodes, simLinks };
  }, [nodes, edges]);

  useEffect(() => {
    if (simNodes.length === 0 || width <= 0 || height <= 0) {
      return;
    }

    const simulation = forceSimulation<SimNode, SimLink>(simNodes)
      .force(
        'link',
        forceLink<SimNode, SimLink>(simLinks)
          .id((d) => d.id)
          .distance(
            (link) =>
              LINK_DISTANCE_BASE + (1 - link.strength) * LINK_DISTANCE_RANGE,
          ),
      )
      .force('charge', forceManyBody<SimNode>().strength(CHARGE_STRENGTH))
      .force('center', forceCenter<SimNode>(width / 2, height / 2))
      .force(
        'collide',
        forceCollide<SimNode>().radius((d) => d.radius + COLLIDE_PADDING),
      )
      .on('tick', () => setTick((t) => t + 1));

    simulationRef.current = simulation;

    return () => {
      simulation.stop();
      simulationRef.current = null;
    };
  }, [simNodes, simLinks, width, height]);

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

  // tick 의존성으로 리렌더 트리거 — simNodes/simLinks 자체 좌표가 바뀜
  void tick;

  return {
    positionedNodes: simNodes,
    positionedLinks: simLinks,
    attachDrag,
  };
}

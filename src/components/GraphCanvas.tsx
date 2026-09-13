"use client";

import { useEffect, useMemo, useRef } from "react";
import {
  ReactFlow,
  ReactFlowProvider,
  ReactFlowInstance,
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  Node,
  Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import CustomNode, { CustomNodeData } from "./CustomNode";
import { layoutWithDagre } from "@/lib/dagreLayout";
import { ComputedNode } from "@/lib/types";

const nodeTypes = { catastrophe: CustomNode };

const SEVERITY_COLORS = ["#3ecf8e", "#e0c341", "#f0803c", "#e2493d", "#9d5ce8"];
function colorForSeverity(sev: number): string {
  if (sev < 20) return SEVERITY_COLORS[0];
  if (sev < 40) return SEVERITY_COLORS[1];
  if (sev < 60) return SEVERITY_COLORS[2];
  if (sev < 80) return SEVERITY_COLORS[3];
  return SEVERITY_COLORS[4];
}

interface GraphCanvasProps {
  nodes: ComputedNode[];
  worstCaseIds: Set<string>;
  onSelectNode: (id: string) => void;
}

function GraphCanvasInner({ nodes = [], worstCaseIds, onSelectNode }: GraphCanvasProps) {
  const instanceRef = useRef<ReactFlowInstance | null>(null);

  const { nodes: flowNodes, edges: flowEdges } = useMemo(() => {
    const safeNodes = Array.isArray(nodes) ? nodes : [];
    const rfNodes: Node[] = safeNodes.map((n) => {
      const data: CustomNodeData = {
        label: n.label,
        severity: n.severity,
        probability: n.probability,
        cumulativeProbability: n.cumulativeProbability,
        depth: n.depth,
        isWorstCase: worstCaseIds.has(n.id),
        onSelect: onSelectNode,
        nodeId: n.id,
      };
      return {
        id: n.id,
        type: "catastrophe",
        data,
        position: { x: 0, y: 0 },
      };
    });

    const rfEdges: Edge[] = safeNodes
      .filter((n) => n.parentId)
      .map((n) => {
        const onWorstCase = worstCaseIds.has(n.id) && worstCaseIds.has(n.parentId as string);
        return {
          id: `${n.parentId}-${n.id}`,
          source: n.parentId as string,
          target: n.id,
          animated: onWorstCase,
          style: {
            stroke: onWorstCase ? "#e2493d" : "#2a3448",
            strokeWidth: onWorstCase ? 2 : 1.25,
          },
        };
      });

    return layoutWithDagre(rfNodes, rfEdges, "TB");
  }, [nodes, worstCaseIds, onSelectNode]);

  // Safety net: if the very first fitView ran before the container had
  // settled into its final size (a known race with flex/percentage-height
  // layouts), re-run it once after mount so the graph is never left
  // scrolled/zoomed out of view.
  useEffect(() => {
    const id = window.setTimeout(() => {
      instanceRef.current?.fitView({ padding: 0.25, duration: 200 });
    }, 80);
    return () => window.clearTimeout(id);
  }, [flowNodes.length]);

  if (flowNodes.length === 0) {
    return (
      <div className="w-full h-full flex items-center justify-center text-ink-500 text-sm">
        Belum ada graf untuk ditampilkan.
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={flowNodes}
      edges={flowEdges}
      nodeTypes={nodeTypes}
      onInit={(instance) => {
        instanceRef.current = instance;
      }}
      fitView
      fitViewOptions={{ padding: 0.25 }}
      minZoom={0.1}
      maxZoom={1.5}
      proOptions={{ hideAttribution: true }}
      className="cdt-flow"
    >
      <Background variant={BackgroundVariant.Dots} gap={22} size={1.4} color="#2a3448" />
      <Controls showInteractive={false} />
      <MiniMap
        maskColor="rgba(5, 7, 11, 0.75)"
        nodeColor={(n: any) => colorForSeverity((n?.data?.severity as number) ?? 0)}
      />
    </ReactFlow>
  );
}

export default function GraphCanvas(props: GraphCanvasProps) {
  return (
    <div style={{ width: "100%", height: "100%", position: "relative" }}>
      <ReactFlowProvider>
        <GraphCanvasInner {...props} />
      </ReactFlowProvider>
    </div>
  );
}

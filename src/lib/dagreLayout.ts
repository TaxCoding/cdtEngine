import dagre from "dagre";
import { Node, Edge, Position } from "@xyflow/react";

const NODE_WIDTH = 260;
const NODE_HEIGHT = 118;

/**
 * Runs Dagre's layered graph-drawing algorithm entirely in the browser to
 * assign (x, y) coordinates to every node, then hands the positioned nodes
 * back for React Flow to render. Keeping this client-side means Vercel's
 * serverless functions never have to do graph-layout work.
 */
export function layoutWithDagre(
  nodes: Node[] | undefined | null,
  edges: Edge[] | undefined | null,
  direction: "TB" | "LR" = "TB"
): { nodes: Node[]; edges: Edge[] } {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safeEdges = Array.isArray(edges) ? edges : [];

  const g = new dagre.graphlib.Graph();
  g.setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, nodesep: 56, ranksep: 96, marginx: 24, marginy: 24 });

  safeNodes.forEach((node) => {
    g.setNode(node.id, { width: NODE_WIDTH, height: NODE_HEIGHT });
  });

  safeEdges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  dagre.layout(g);

  const columns = Math.max(1, Math.ceil(Math.sqrt(safeNodes.length)));

  const layoutedNodes: Node[] = safeNodes.map((node, index) => {
    const pos = g.node(node.id);
    const hasValidPos = pos && Number.isFinite(pos.x) && Number.isFinite(pos.y);

    // Defensive fallback: if Dagre couldn't place a node (malformed edge
    // data, etc.), lay it out on a simple grid instead of letting it default
    // to (0, 0) - which would silently stack it invisibly under other nodes.
    const fallbackX = (index % columns) * (NODE_WIDTH + 40);
    const fallbackY = Math.floor(index / columns) * (NODE_HEIGHT + 60);

    return {
      ...node,
      targetPosition: direction === "TB" ? Position.Top : Position.Left,
      sourcePosition: direction === "TB" ? Position.Bottom : Position.Right,
      position: hasValidPos
        ? { x: pos.x - NODE_WIDTH / 2, y: pos.y - NODE_HEIGHT / 2 }
        : { x: fallbackX, y: fallbackY },
    };
  });

  return { nodes: layoutedNodes, edges: safeEdges };
}

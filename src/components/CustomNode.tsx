"use client";

import { Handle, Position, NodeProps } from "@xyflow/react";
import { memo, CSSProperties } from "react";

export interface CustomNodeData {
  label: string;
  severity: number;
  probability: number;
  cumulativeProbability: number;
  depth: number;
  isWorstCase: boolean;
  onSelect: (id: string) => void;
  nodeId: string;
  [key: string]: unknown;
}

function severityColor(severity: number): string {
  if (severity < 20) return "#3ecf8e";
  if (severity < 40) return "#e0c341";
  if (severity < 60) return "#f0803c";
  if (severity < 80) return "#e2493d";
  return "#9d5ce8";
}

function hexToRgb(hex: string): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `${r}, ${g}, ${b}`;
}

function CustomNode({ data }: NodeProps) {
  const d = data as unknown as CustomNodeData;
  const color = severityColor(d.severity);
  const rgb = hexToRgb(color);

  // Computed inline (not via Tailwind arbitrary-opacity utilities) so the
  // node's core visual identity never depends on a specific Tailwind build
  // being able to resolve a dynamic color/opacity combination.
  const style: CSSProperties = {
    width: 260,
    backgroundColor: `rgba(${rgb}, 0.1)`,
    border: `1px solid rgba(${rgb}, 0.55)`,
    boxShadow: d.isWorstCase ? `0 0 0 3px rgba(226,73,61,0.18)` : undefined,
  };

  return (
    <div
      onClick={() => d.onSelect(d.nodeId)}
      style={style}
      className="rounded-md bg-ink-850 px-4 py-3 cursor-pointer transition-transform hover:scale-[1.02]"
    >
      <Handle type="target" position={Position.Top} style={{ background: "#455065", border: 0, width: 6, height: 6 }} />

      <div className="flex items-center justify-between mb-2">
        <span className="text-[10px] font-mono text-ink-500">d{d.depth}</span>
        <span className="text-[10px] font-mono font-semibold" style={{ color }}>
          SEV {d.severity}
        </span>
      </div>

      <p className="text-[13px] text-slate-200 leading-snug line-clamp-3">{d.label}</p>

      <div className="mt-2.5 flex justify-between text-[10px] font-mono text-ink-500">
        <span>p {d.probability.toFixed(3)}</span>
        <span>P_cum {d.cumulativeProbability.toExponential(2)}</span>
      </div>

      <Handle type="source" position={Position.Bottom} style={{ background: "#455065", border: 0, width: 6, height: 6 }} />
    </div>
  );
}

export default memo(CustomNode);

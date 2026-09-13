"use client";

import { ComputedNode } from "@/lib/types";

interface NodeDetailPanelProps {
  node: ComputedNode | null;
  onClose: () => void;
}

export default function NodeDetailPanel({ node, onClose }: NodeDetailPanelProps) {
  if (!node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-lg bg-ink-850 border border-ink-700 p-5"
      >
        <div className="flex justify-between items-start mb-3">
          <span className="text-ink-500 text-xs font-mono">
            depth {node.depth} · {node.id}
          </span>
          <button onClick={onClose} className="text-ink-500 hover:text-slate-200 text-sm leading-none">
            ✕
          </button>
        </div>

        <p className="text-slate-100 text-[15px] leading-relaxed mb-4">{node.label}</p>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <Stat label="Severity" value={node.severity.toString()} accent="text-severity-critical" />
          <Stat label="CRI" value={node.cri.toFixed(2)} accent="text-severity-extreme" />
          <Stat label="P kondisional" value={node.probability.toFixed(4)} accent="text-slate-300" />
          <Stat label="P_cum dari root" value={node.cumulativeProbability.toExponential(3)} accent="text-slate-300" />
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent: string }) {
  return (
    <div className="rounded-md bg-ink-900 border border-ink-700 p-2.5">
      <p className="text-ink-500 text-[10px] mb-1">{label}</p>
      <p className={`font-mono font-semibold ${accent}`}>{value}</p>
    </div>
  );
}

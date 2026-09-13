"use client";

import { ComputedNode, WorstCasePathResult } from "@/lib/types";

interface StatsPanelProps {
  rootDecision: string;
  nodes?: ComputedNode[];
  worstCase?: WorstCasePathResult;
  onReset: () => void;
  onSelectNode: (id: string) => void;
}

export default function StatsPanel({
  rootDecision,
  nodes = [],
  worstCase = { path: [], totalCri: 0 },
  onReset,
  onSelectNode,
}: StatsPanelProps) {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const safePath = Array.isArray(worstCase?.path) ? worstCase.path : [];
  const maxSeverity = safeNodes.length ? Math.max(...safeNodes.map((n) => n.severity)) : 0;
  const finalNode = safePath[safePath.length - 1];
  const ranked = [...safeNodes].sort((a, b) => b.cri - a.cri).slice(0, 8);

  return (
    <div className="w-full h-full flex flex-col gap-5 p-5 overflow-y-auto">
      <div>
        <p className="text-slate-500 text-xs mb-1">Keputusan awal</p>
        <p className="text-slate-100 text-sm leading-snug">{rootDecision}</p>
      </div>

      <div className="flex gap-4 border-y border-ink-700 py-3">
        <div className="flex-1">
          <p className="text-2xl font-semibold text-slate-100 font-mono">{safeNodes.length}</p>
          <p className="text-ink-500 text-[11px]">simpul dipetakan</p>
        </div>
        <div className="flex-1">
          <p className="text-2xl font-semibold text-severity-critical font-mono">{maxSeverity}</p>
          <p className="text-ink-500 text-[11px]">severity puncak</p>
        </div>
      </div>

      <div className="border-l-2 border-severity-critical pl-3">
        <p className="text-severity-critical text-xs font-medium mb-1">Jalur terburuk</p>
        <p className="text-ink-500 text-[11px] mb-2.5 leading-relaxed">
          Rantai eskalasi dengan Catastrophe Risk Index kumulatif tertinggi —{" "}
          <span className="font-mono text-slate-400">{(worstCase.totalCri ?? 0).toFixed(1)}</span>
        </p>
        <div className="flex flex-col gap-1">
          {safePath.map((n) => (
            <button
              key={n.id}
              onClick={() => onSelectNode(n.id)}
              className="text-left text-xs text-slate-400 hover:text-slate-100 truncate transition-colors"
            >
              {n.label}
            </button>
          ))}
        </div>
        {finalNode && (
          <p className="mt-2.5 text-[11px] text-ink-500 font-mono">
            titik akhir · sev {finalNode.severity} · P_cum {finalNode.cumulativeProbability.toExponential(2)}
          </p>
        )}
      </div>

      <div className="flex-1">
        <p className="text-slate-500 text-xs mb-2">Peringkat CRI</p>
        <ol className="flex flex-col gap-1">
          {ranked.map((n, i) => (
            <li key={n.id}>
              <button
                onClick={() => onSelectNode(n.id)}
                className="w-full flex items-center gap-2.5 text-left text-xs hover:bg-ink-800/60 rounded px-1.5 py-1.5 transition-colors"
              >
                <span className="text-ink-600 font-mono w-4 shrink-0">{i + 1}</span>
                <span className="flex-1 truncate text-slate-400">{n.label}</span>
                <span className="font-mono text-slate-300 shrink-0">{n.cri.toFixed(1)}</span>
              </button>
            </li>
          ))}
        </ol>
      </div>

      <button
        onClick={onReset}
        className="w-full rounded-md border border-ink-700 hover:border-ink-500 text-slate-500 hover:text-slate-300 text-xs py-2.5 transition-colors"
      >
        Mulai simulasi baru
      </button>
    </div>
  );
}

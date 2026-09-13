"use client";

import { useState, useCallback, useMemo } from "react";
import DecisionInput from "@/components/DecisionInput";
import LoadingState from "@/components/LoadingState";
import GraphCanvas from "@/components/GraphCanvas";
import StatsPanel from "@/components/StatsPanel";
import NodeDetailPanel from "@/components/NodeDetailPanel";
import HistorySidebar from "@/components/HistorySidebar";
import GraphErrorBoundary from "@/components/GraphErrorBoundary";
import { computeAllNodes, findWorstCasePath } from "@/lib/graphMath";
import { RawNode, Language } from "@/lib/types";
import { fetchJson } from "@/lib/fetchJson";

type ViewState = "input" | "loading" | "graph";

export default function Home() {
  const [view, setView] = useState<ViewState>("input");
  const [error, setError] = useState<string | null>(null);
  const [rootDecision, setRootDecision] = useState("");
  const [rawNodes, setRawNodes] = useState<RawNode[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [historyRefreshKey, setHistoryRefreshKey] = useState(0);

  const computedNodes = useMemo(() => computeAllNodes(rawNodes), [rawNodes]);
  const worstCase = useMemo(() => findWorstCasePath(computedNodes), [computedNodes]);
  const worstCaseIds = useMemo(() => new Set(worstCase.path.map((n) => n.id)), [worstCase]);
  const selectedNode = useMemo(
    () => computedNodes.find((n) => n.id === selectedNodeId) ?? null,
    [computedNodes, selectedNodeId]
  );

  const handleGenerate = useCallback(async (decision: string, language: Language) => {
    setError(null);
    setView("loading");
    try {
      const data = await fetchJson<{ graph?: { rootDecision: string; nodes: RawNode[]; language?: Language } }>(
        "/api/generate",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ decision, language }),
        }
      );

      if (!data.graph) throw new Error("Respons server tidak berisi data graf.");

      setRootDecision(data.graph.rootDecision ?? decision);
      setRawNodes(Array.isArray(data.graph.nodes) ? data.graph.nodes : []);
      setSelectedNodeId(null);
      setView("graph");

      // Best-effort persistence; failures (e.g. no MONGODB_URI configured)
      // shouldn't block viewing the graph that was just generated.
      fetch("/api/graphs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rootDecision: data.graph.rootDecision,
          nodes: data.graph.nodes,
          language: data.graph.language ?? language,
        }),
      })
        .then((r) => {
          if (r.ok) setHistoryRefreshKey((k) => k + 1);
        })
        .catch(() => {});
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setView("input");
    }
  }, []);

  const handleLoadHistory = useCallback(async (id: string) => {
    setError(null);
    setView("loading");
    try {
      const data = await fetchJson<{ graph?: { rootDecision: string; nodes: RawNode[] } }>(
        `/api/graphs/${id}`
      );
      if (!data.graph) throw new Error("Respons server tidak berisi data graf.");
      setRootDecision(data.graph.rootDecision ?? "");
      setRawNodes(Array.isArray(data.graph.nodes) ? data.graph.nodes : []);
      setSelectedNodeId(null);
      setView("graph");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Terjadi kesalahan.");
      setView("input");
    }
  }, []);

  const handleReset = useCallback(() => {
    setView("input");
    setRawNodes([]);
    setSelectedNodeId(null);
    setError(null);
  }, []);

  if (view === "loading") {
    return <LoadingState />;
  }

  if (view === "graph") {
    return (
      <GraphErrorBoundary onReset={handleReset}>
        <div className="h-screen w-screen flex flex-col sm:flex-row bg-ink-900">
          <div className="flex-1 relative min-h-[50vh]">
            <GraphCanvas nodes={computedNodes} worstCaseIds={worstCaseIds} onSelectNode={setSelectedNodeId} />
            <HistorySidebar onLoad={handleLoadHistory} refreshKey={historyRefreshKey} />
          </div>
          <div className="w-full sm:w-80 border-t sm:border-t-0 sm:border-l border-ink-700 bg-ink-900">
            <StatsPanel
              rootDecision={rootDecision}
              nodes={computedNodes}
              worstCase={worstCase}
              onReset={handleReset}
              onSelectNode={setSelectedNodeId}
            />
          </div>
          <NodeDetailPanel node={selectedNode} onClose={() => setSelectedNodeId(null)} />
        </div>
      </GraphErrorBoundary>
    );
  }

  return (
    <>
      <DecisionInput onSubmit={handleGenerate} error={error} />
      <HistorySidebar onLoad={handleLoadHistory} refreshKey={historyRefreshKey} />
    </>
  );
}

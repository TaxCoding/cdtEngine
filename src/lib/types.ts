export type Language = "id" | "en" | "jv-ngoko";

export const LANGUAGE_LABELS: Record<Language, string> = {
  id: "Bahasa Indonesia",
  en: "English",
  "jv-ngoko": "Jowo Ngoko",
};

/**
 * A single escalation event as produced by Gemini (or loaded from MongoDB).
 * `probability` is the CONDITIONAL probability of this node occurring given
 * that its parent already occurred (not the cumulative probability from root).
 */
export interface RawNode {
  id: string;
  parentId: string | null;
  depth: number;
  label: string;
  severity: number; // 1-100, monotonically increasing with depth
  probability: number; // 0-1, conditional on parent
}

export interface RawGraph {
  rootDecision: string;
  nodes: RawNode[];
  language?: Language;
}

export interface StoredGraphSummary {
  id: string;
  rootDecision: string;
  createdAt: string;
  language?: Language;
}

export interface StoredGraph extends RawGraph {
  id: string;
  createdAt: string;
}

/**
 * A node enriched with client-side computed metrics:
 * - cumulativeProbability: P_cum from root to this node
 * - cri: Catastrophe Risk Index
 */
export interface ComputedNode extends RawNode {
  cumulativeProbability: number;
  cri: number;
}

export interface WorstCasePathResult {
  path: ComputedNode[];
  totalCri: number;
}

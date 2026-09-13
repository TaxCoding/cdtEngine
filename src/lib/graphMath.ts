import { RawNode, ComputedNode, WorstCasePathResult } from "./types";

/**
 * === Cumulative Path Probability P_cum(v_k) ===
 *
 * For a node v_k reached via root -> v_1 -> v_2 -> ... -> v_k, each edge
 * carries a conditional probability P(v_i | v_(i-1)). The cumulative
 * probability of reaching v_k from the root is the product of every
 * conditional probability along that unique path:
 *
 *   P_cum(v_k) = P(v_1|root) * P(v_2|v_1) * ... * P(v_k|v_(k-1))
 *
 * Because this is a DAG built strictly from parent pointers (a tree in
 * practice), each node has exactly one path back to the root, so this
 * reduces to a simple memoized recursive product.
 */
export function computeCumulativeProbabilities(nodes: RawNode[] | undefined | null): Map<string, number> {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  const byId = new Map(safeNodes.map((n) => [n.id, n]));
  const cache = new Map<string, number>();

  function resolve(nodeId: string, guard: Set<string>): number {
    if (cache.has(nodeId)) return cache.get(nodeId)!;
    const node = byId.get(nodeId);
    if (!node) return 0;

    // Guard against malformed cyclical data from the model - treat as root if seen before.
    if (guard.has(nodeId) || node.parentId === null || node.parentId === undefined || !byId.has(node.parentId)) {
      const value = clampProbability(node.probability);
      cache.set(nodeId, value);
      return value;
    }

    guard.add(nodeId);
    const parentCum = resolve(node.parentId, guard);
    const value = parentCum * clampProbability(node.probability);
    cache.set(nodeId, value);
    return value;
  }

  for (const node of safeNodes) resolve(node.id, new Set());
  return cache;
}

function clampProbability(p: number): number {
  if (Number.isNaN(p)) return 0;
  return Math.min(Math.max(p, 0), 1);
}

/**
 * === Catastrophe Risk Index (CRI) ===
 *
 * A deliberately pseudo-scientific statistic that rewards outcomes which are
 * BOTH severe and improbable - the hallmark of a genuinely catastrophic risk.
 * It compares the severity impact (S) against the inverse log of the
 * cumulative probability of reaching that node:
 *
 *   CRI(v) = S(v) * -log10( P_cum(v) )
 *
 * Interpretation:
 * - As P_cum -> 1 (near-certain outcome), -log10(P_cum) -> 0, so CRI shrinks
 *   toward 0 regardless of severity: "of course that happened, it was
 *   basically guaranteed."
 * - As P_cum -> 0 (a wildly unlikely outcome), -log10(P_cum) grows without
 *   bound, so even moderate severity produces a large CRI: "small chance,
 *   but if it happens, it's a big deal."
 * - Probability is clamped to [1e-9, 1] to avoid -log10(0) = Infinity.
 */
export function computeCRI(severity: number, pCum: number): number {
  const safeP = Math.min(Math.max(pCum, 1e-9), 1);
  const inverseLog = -Math.log10(safeP);
  return severity * inverseLog;
}

/**
 * Enriches every raw node with its cumulative probability and CRI.
 */
export function computeAllNodes(nodes: RawNode[] | undefined | null): ComputedNode[] {
  const safeNodes = Array.isArray(nodes) ? nodes : [];
  if (safeNodes.length === 0) return [];
  const cumMap = computeCumulativeProbabilities(safeNodes);
  return safeNodes.map((n) => {
    const cumulativeProbability = cumMap.get(n.id) ?? 0;
    const cri = computeCRI(n.severity, cumulativeProbability);
    return { ...n, cumulativeProbability, cri };
  });
}

/**
 * === Worst-Case Path Search ===
 *
 * A Critical-Path-Method-style traversal: starting at the root, walk every
 * root-to-leaf path in the DAG, summing each node's CRI along the way, and
 * keep the path whose accumulated CRI is largest. This surfaces the single
 * escalation chain that is simultaneously the most severe AND the least
 * probable end-to-end - the "worst case" in the plain-English sense.
 *
 * Implementation is a DFS from the root over a DAG built from parent
 * pointers (no back-edges are possible since depth strictly increases),
 * so this always terminates and never revisits a node.
 */
export function findWorstCasePath(computedNodes: ComputedNode[] | undefined | null): WorstCasePathResult {
  const safeNodes = Array.isArray(computedNodes) ? computedNodes : [];
  if (safeNodes.length === 0) return { path: [], totalCri: 0 };

  const childrenByParent = new Map<string, ComputedNode[]>();
  let root: ComputedNode | undefined;

  for (const node of safeNodes) {
    if (node.parentId && childrenByParent.has(node.parentId)) {
      childrenByParent.get(node.parentId)!.push(node);
    } else if (node.parentId) {
      childrenByParent.set(node.parentId, [node]);
    }
    if (!root && (node.parentId === null || node.parentId === undefined)) {
      root = node;
    }
  }

  // Fallback: if no explicit root was found (malformed data), use the shallowest node.
  if (!root) {
    root = [...safeNodes].sort((a, b) => a.depth - b.depth)[0];
  }

  let best: WorstCasePathResult = { path: [root], totalCri: root.cri };

  function dfs(node: ComputedNode, path: ComputedNode[], totalCri: number) {
    const children = childrenByParent.get(node.id) ?? [];
    if (children.length === 0) {
      if (totalCri > best.totalCri) {
        best = { path, totalCri };
      }
      return;
    }
    for (const child of children) {
      dfs(child, [...path, child], totalCri + child.cri);
    }
  }

  dfs(root, [root], root.cri);
  return best;
}

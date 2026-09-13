import { RawGraph, RawNode, Language } from "./types";

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

const LANGUAGE_INSTRUCTIONS: Record<Language, string> = {
  id: 'Tulis SEMUA teks "label" dalam Bahasa Indonesia sehari-hari yang natural dan mengalir, seperti gaya seorang analis bencana yang bertutur datar (deadpan) - bukan terjemahan kaku dari Bahasa Inggris, dan bukan bahasa baku laporan resmi.',
  en: 'Write ALL "label" text in natural, deadpan English, as if a bored disaster-report analyst is narrating an absurd chain reaction with a completely straight face.',
  "jv-ngoko":
    'Tulis SEMUA teks "label" nganggo Basa Jawa gaul/ngoko - kaya cara ngomong bocah nongkrong karo kancane, santai, guyon, apa anane. Aja nganggo krama utawa basa Indonesia/Inggris babar blas. Istilah teknis (persen, data, sistem, lsp) tetep oleh dienggo yen perlu, ning dibungkus nganggo rasa basa ngoko sing kepenak diwaca lan lucu.',
};

const FLAVOR_POOL = [
  "government bureaucracy and paperwork",
  "a specific animal or wildlife behaving unexpectedly",
  "social media virality and public opinion",
  "the stock market or a specific financial instrument",
  "sudden weather or a natural phenomenon",
  "urban infrastructure (power grid, water supply, public transit)",
  "a legal dispute, lawsuit, or courtroom drama",
  "a sporting event or competition",
  "a religious, cultural, or neighborhood festival",
  "a scientific experiment or lab that goes sideways",
  "a school, university, or classroom",
  "a wedding, funeral, or family gathering",
  "a tech startup, app, or piece of software",
  "a restaurant, warung, or food supply chain",
  "an election or political campaign",
  "space exploration, a satellite, or an observatory",
  "a hospital or public health system",
  "a concert, festival, or the entertainment industry",
  "an underground or subterranean event (mining, tunnels, sewers, pipes)",
  "a cross-border or international relations incident",
  "a shipping port, cargo, or logistics network",
  "a local market or traditional trade",
  "an insurance company processing an unusual claim",
  "a viral street food trend",
];

function pickRandomFlavors(count: number): string[] {
  const shuffled = [...FLAVOR_POOL].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}

function buildSystemInstruction(opts: {
  language: Language;
  targetNodes: number;
  minBranchingNodes: number;
  maxDepth: number;
  flavors: string[];
}): string {
  const { language, targetNodes, minBranchingNodes, maxDepth, flavors } = opts;

  return `You are the Catastrophic Decision Engine. Convert a user's daily decision into a Directed Acyclic Graph (DAG) escalating into an absurd catastrophe.

ESCALATION BY DEPTH (d), where the deepest nodes in this specific generation sit at d=${maxDepth}:
- d=0 (Root): The initial user decision itself.
- d=1: Minor personal inconvenience.
- d=2: Social embarrassment or small-scale local chaos.
- d=3: Infrastructure or municipal-level failure.
- d=4 through d=${maxDepth}: Regional disaster escalating to a genuinely absurd, large-scale climax.

STRUCTURE RULES:
- Generate exactly ${targetNodes} total nodes with clear parent-child dependencies (a tree: every non-root node has exactly one parentId pointing to an existing node id).
- This must be a visibly BRANCHING tree, not a single chain: at least ${minBranchingNodes} distinct nodes must each have 2 or 3 children, so the graph fans out into multiple parallel escalation paths a reader can compare side by side.
- Depth of a non-root node always equals its parent's depth + 1.
- Severity scores MUST increase monotonically with depth (roughly 1 up to 100 as depth goes from 0 to ${maxDepth}).
- Conditional probability (the chance of this node given its parent already happened) MUST drop as depth increases (roughly 0.9 down to 0.0001).
- The root node (d=0) has parentId = null, depth = 0, severity around 1-5, and probability = 1.
- Node ids must be short and unique: "n0", "n1", "n2", ...

CREATIVITY RULES (read carefully - this is the most important part, and generations are judged harshly on repetitiveness):
- Weave these specific real-world domains into the escalation, spread across different branches and depths, in a way that feels like a natural causal chain from the original decision - connect them logically, don't force them in randomly: ${flavors.join(", ")}.
- Every generation must feel genuinely different in flavor from a generic "traffic jam -> server failure -> cosmic event" template. Do not default to aliens, a "cosmic reset", sentient weather, or a global market flash-crash as the climax unless the required domains above make that the single most natural fit - prefer a climax that is clearly, specifically tied to the domains you were given.
- Reference specific, concrete, sensory details from the user's actual decision throughout the chain (smells, textures, specific objects, specific local institutions) rather than generic phrasing - make it feel bespoke to this exact decision, not a reusable template you'd write for any decision.
- Vary sentence rhythm between nodes - do not write every label with the same "X leads to Y, causing Z" shape. Mix short, punchy labels with longer, more elaborate ones.
- ${LANGUAGE_INSTRUCTIONS[language]}
- Tone: dark satire, deadpan humor, pseudo-scientific logic.
- Output must be a tree: exactly one root, and every other node reachable from it.`;
}

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    nodes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          id: { type: "STRING", description: "Short unique id, e.g. n0, n1, n2" },
          parentId: {
            type: "STRING",
            nullable: true,
            description: "id of the parent node, or null for the root node",
          },
          depth: { type: "INTEGER", description: "0 for root, increasing by 1 per escalation level" },
          label: { type: "STRING", description: "Deadpan, dark-satire description of this escalation event" },
          severity: { type: "INTEGER", description: "1-100, must increase monotonically with depth" },
          probability: {
            type: "NUMBER",
            description: "Conditional probability given the parent occurred, 0-1, decreasing with depth",
          },
        },
        required: ["id", "parentId", "depth", "label", "severity", "probability"],
      },
    },
  },
  required: ["nodes"],
};

export class GeminiConfigError extends Error {}
export class GeminiRequestError extends Error {}

export async function generateCatastropheGraph(
  decision: string,
  language: Language = "id"
): Promise<RawGraph> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new GeminiConfigError("GEMINI_API_KEY is not configured on the server.");
  }

  // Randomize the "shape" of each generation so consecutive requests - even
  // for similar decisions - don't converge on the same size/structure/climax.
  // Kept modest (vs. an even wider range) so gemini-2.5-flash reliably
  // responds well within the serverless function's time budget.
  const targetNodes = 9 + Math.floor(Math.random() * 6); // 9-14
  const maxDepth = 4 + Math.floor(Math.random() * 3); // 4-6
  const minBranchingNodes = Math.max(2, Math.round(targetNodes / 4));
  const flavors = pickRandomFlavors(3);

  const systemInstruction = buildSystemInstruction({
    language,
    targetNodes,
    minBranchingNodes,
    maxDepth,
    flavors,
  });

  const requestBody = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: "user",
        parts: [
          {
            text: `User's daily decision: "${decision}".\n\nGenerate the catastrophic escalation DAG now. The root node must have id "n0", parentId null, depth 0, and its label should restate the user's decision itself.`,
          },
        ],
      },
    ],
    generationConfig: {
      // Bumped above the SDD's baseline (0.8) specifically to fight
      // repetitive/templated output - variety was reported as too low.
      temperature: 1.0,
      topP: 0.95,
      responseMimeType: "application/json",
      responseSchema: RESPONSE_SCHEMA,
    },
  };

  let res: Response;
  const controller = new AbortController();
  // Stay safely under the route's maxDuration (60s) so we always get the
  // chance to return a clean JSON error instead of Vercel hard-killing the
  // function and returning a non-JSON timeout page to the client.
  const timeoutId = setTimeout(() => controller.abort(), 50000);
  try {
    res = await fetch(`${GEMINI_URL}?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(requestBody),
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new GeminiRequestError(
        "Gemini butuh waktu terlalu lama untuk merespons. Coba lagi - biasanya percobaan berikutnya lebih cepat."
      );
    }
    throw new GeminiRequestError("Could not reach the Gemini API. Check server network access.");
  } finally {
    clearTimeout(timeoutId);
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = await res.text();
    } catch {
      // ignore
    }
    throw new GeminiRequestError(`Gemini API error (${res.status}): ${detail || res.statusText}`);
  }

  const data = await res.json();
  const text: string | undefined = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!text) {
    const blockReason = data?.promptFeedback?.blockReason;
    throw new GeminiRequestError(
      blockReason
        ? `Gemini declined to respond (reason: ${blockReason}). Try rephrasing your decision.`
        : "Gemini returned an empty response."
    );
  }

  let parsed: { nodes: RawNode[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new GeminiRequestError("Failed to parse Gemini's JSON output.");
  }

  const nodes = normalizeNodes(parsed?.nodes ?? [], decision);

  if (nodes.length === 0) {
    throw new GeminiRequestError("Gemini output did not contain any valid nodes.");
  }

  return { rootDecision: decision, nodes, language };
}

/**
 * Defensive cleanup for LLM output:
 * - normalizes parentId variants some models emit instead of a true null
 * - de-duplicates ids and guarantees a single reachable root
 * - RECOMPUTES depth from the actual parent chain via BFS instead of
 *   trusting the model's own "depth" field (which can be inconsistent -
 *   e.g. a child reported at the same depth as its parent), so Dagre's
 *   layout ranks and the severity-by-depth color coding are always correct
 * - enforces a monotonically increasing severity / decreasing probability
 *   along every edge, nudging any value that slipped instead of trusting
 *   the model's arithmetic blindly
 */
function normalizeNodes(nodes: RawNode[], fallbackRootLabel: string): RawNode[] {
  if (!Array.isArray(nodes) || nodes.length === 0) return [];

  const cleanedRaw = nodes
    .filter((n) => n && typeof n.id === "string" && typeof n.label === "string")
    .map((n) => ({
      id: n.id,
      parentId:
        n.parentId === "" || (n.parentId as unknown) === "null" || n.parentId === undefined
          ? null
          : (n.parentId as string | null),
      depth: 0, // recomputed below
      label: n.label || fallbackRootLabel,
      severity: clamp(Number.isFinite(n.severity) ? n.severity : 1, 1, 100),
      probability: clamp(Number.isFinite(n.probability) ? n.probability : 0.5, 0.0001, 1),
    }));

  const seen = new Set<string>();
  const cleaned = cleanedRaw.filter((n) => {
    if (seen.has(n.id)) return false;
    seen.add(n.id);
    return true;
  });

  if (cleaned.length === 0) return [];

  const byId = new Map(cleaned.map((n) => [n.id, n]));

  let roots = cleaned.filter((n) => n.parentId === null || !byId.has(n.parentId as string));
  if (roots.length === 0) {
    cleaned[0].parentId = null;
    roots = [cleaned[0]];
  }
  const root = roots[0];
  root.parentId = null;
  for (const extraRoot of roots.slice(1)) {
    extraRoot.parentId = root.id;
  }

  const childrenMap = new Map<string, RawNode[]>();
  for (const n of cleaned) {
    if (n.parentId && byId.has(n.parentId)) {
      if (!childrenMap.has(n.parentId)) childrenMap.set(n.parentId, []);
      childrenMap.get(n.parentId)!.push(n);
    }
  }

  root.depth = 0;
  const visited = new Set<string>([root.id]);
  const queue: RawNode[] = [root];

  while (queue.length > 0) {
    const current = queue.shift()!;
    const children = childrenMap.get(current.id) ?? [];
    for (const child of children) {
      if (visited.has(child.id)) continue; // guards against malformed cycles
      visited.add(child.id);
      child.depth = current.depth + 1;

      if (child.severity <= current.severity) {
        child.severity = clamp(current.severity + 3 + Math.round(Math.random() * 6), 1, 100);
      }
      if (child.probability >= current.probability) {
        child.probability = clamp(current.probability * (0.3 + Math.random() * 0.4), 0.0001, 1);
      }

      queue.push(child);
    }
  }

  // Drop anything never reached from the root (orphaned by malformed parentId chains).
  return cleaned.filter((n) => visited.has(n.id));
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

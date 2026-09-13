import { NextRequest, NextResponse } from "next/server";
import { generateCatastropheGraph, GeminiConfigError, GeminiRequestError } from "@/lib/gemini";
import type { Language } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

const VALID_LANGUAGES: Language[] = ["id", "en", "jv-ngoko"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const decision = typeof body?.decision === "string" ? body.decision.trim() : "";
    const language: Language = VALID_LANGUAGES.includes(body?.language) ? body.language : "id";

    if (!decision) {
      return NextResponse.json({ error: "Decision text is required." }, { status: 400 });
    }
    if (decision.length > 300) {
      return NextResponse.json(
        { error: "Decision text is too long (max 300 characters)." },
        { status: 400 }
      );
    }

    const graph = await generateCatastropheGraph(decision, language);
    return NextResponse.json({ graph });
  } catch (err) {
    console.error("[/api/generate] error:", err);

    if (err instanceof GeminiConfigError) {
      return NextResponse.json(
        { error: "Server is missing GEMINI_API_KEY. Add it in your Vercel project's environment variables." },
        { status: 500 }
      );
    }
    if (err instanceof GeminiRequestError) {
      return NextResponse.json({ error: err.message }, { status: 502 });
    }

    const message = err instanceof Error ? err.message : "Failed to generate catastrophe graph.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

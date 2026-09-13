import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import type { RawNode } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const rootDecision = typeof body?.rootDecision === "string" ? body.rootDecision : "";
    const nodes: RawNode[] = Array.isArray(body?.nodes) ? body.nodes : [];

    if (!rootDecision || nodes.length === 0) {
      return NextResponse.json({ error: "Invalid graph payload." }, { status: 400 });
    }

    const language = typeof body?.language === "string" ? body.language : undefined;

    const db = await getDb();
    const doc = {
      rootDecision,
      nodes,
      language,
      createdAt: new Date().toISOString(),
    };
    const result = await db.collection("graphs").insertOne(doc);

    return NextResponse.json({ id: result.insertedId.toString() });
  } catch (err) {
    console.error("[/api/graphs POST] error:", err);
    const message = err instanceof Error ? err.message : "Failed to save graph.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET() {
  try {
    const db = await getDb();
    const docs = await db
      .collection("graphs")
      .find({}, { projection: { rootDecision: 1, createdAt: 1, language: 1 } })
      .sort({ createdAt: -1 })
      .limit(20)
      .toArray();

    const history = docs.map((d) => ({
      id: d._id.toString(),
      rootDecision: d.rootDecision as string,
      createdAt: d.createdAt as string,
      language: d.language as string | undefined,
    }));

    return NextResponse.json({ history });
  } catch (err) {
    console.error("[/api/graphs GET] error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch history.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

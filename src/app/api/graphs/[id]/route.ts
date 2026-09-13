import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/mongodb";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    if (!ObjectId.isValid(id)) {
      return NextResponse.json({ error: "Invalid graph id." }, { status: 400 });
    }

    const db = await getDb();
    const doc = await db.collection("graphs").findOne({ _id: new ObjectId(id) });

    if (!doc) {
      return NextResponse.json({ error: "Graph not found." }, { status: 404 });
    }

    return NextResponse.json({
      graph: {
        id: doc._id.toString(),
        rootDecision: doc.rootDecision,
        nodes: doc.nodes,
        language: doc.language,
        createdAt: doc.createdAt,
      },
    });
  } catch (err) {
    console.error("[/api/graphs/[id] GET] error:", err);
    const message = err instanceof Error ? err.message : "Failed to fetch graph.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

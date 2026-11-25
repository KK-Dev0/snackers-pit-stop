import { NextRequest, NextResponse } from "next/server";

import { RecommendRequestSchema } from "@/lib/schemas";
import { getDb } from "@/server/db/client";
import { createRecipeRetriever } from "@/server/retrieval";
import { rateLimitRequest } from "@/server/rate-limit";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = RecommendRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const rl = rateLimitRequest(request, "recommend");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": "60" } },
    );
  }

  const retriever = createRecipeRetriever(getDb());
  const results = await retriever.retrieve({
    diet: parsed.data.diet,
    allergens: parsed.data.allergens,
    dislikes: parsed.data.dislikes,
    mealSlot: parsed.data.slot,
    pantryNames: parsed.data.pantryNames,
    pantryIngredientIds: parsed.data.pantryIngredientIds,
    query: parsed.data.query,
    limit: parsed.data.limit,
  });

  return NextResponse.json({ items: results });
}
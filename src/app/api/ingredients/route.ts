import { NextResponse } from "next/server";

import { getDb } from "@/server/db/client";
import { listIngredients } from "@/server/db/queries/ingredients";

export const runtime = "nodejs";

export async function GET() {
  const items = await listIngredients(getDb());
  return NextResponse.json(
    { items },
    { headers: { "Cache-Control": "public, max-age=300, s-maxage=600" } },
  );
}
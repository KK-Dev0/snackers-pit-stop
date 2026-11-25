import { NextRequest, NextResponse } from "next/server";

import { RecipeBySlugParamsSchema } from "@/lib/schemas";
import { getRecipeBySlug } from "@/server/db/queries/recipes";
import { getDb } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ slug: string }> },
) {
  const params = await context.params;
  const parsed = RecipeBySlugParamsSchema.safeParse(params);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid slug", issues: parsed.error.issues },
      { status: 400 },
    );
  }

  const db = getDb();
  const recipe = await getRecipeBySlug(parsed.data.slug, db);
  if (!recipe) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json(recipe, {
    headers: {
      "Cache-Control": "public, max-age=60, s-maxage=300",
    },
  });
}
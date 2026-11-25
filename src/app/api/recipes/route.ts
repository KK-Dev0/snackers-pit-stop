/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from "next/server";

import { RecipeListQuerySchema } from "@/lib/schemas";
import { sortRecipes } from "@/lib/recipe-sort";
import { listRecipesWithIngredients } from "@/server/db/queries/recipes";
import { getDb } from "@/server/db/client";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const parsed = RecipeListQuerySchema.safeParse(Object.fromEntries(searchParams));
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid query", issues: parsed.error.issues },
      { status: 400 },
    );
  }
  const q = parsed.data;

  const db = getDb();
  let items = await listRecipesWithIngredients(db);

  // filter by diet
  if (q.diet) {
    items = items.filter((r: any) => r.diet === q.diet);
  }
  // filter by slot
  if (q.slot) {
    items = items.filter((r: any) =>
      (r.mealSlots ?? []).includes(q.slot),
    );
  }
  // filter by cuisine
  if (q.cuisine) {
    items = items.filter(
      (r: any) => String(r.cuisine).toLowerCase() === q.cuisine!.toLowerCase(),
    );
  }
  // filter by tag
  if (q.tag) {
    items = items.filter((r: any) =>
      (r.tags ?? []).includes(q.tag),
    );
  }
  // filter by allergens exclusion (comma list)
  if (q.allergens) {
    const excluded = q.allergens.split(",").map((a) => a.trim().toLowerCase());
    items = items.filter(
      (r: any) =>
        !(r.allergens ?? []).some((a: string) =>
          excluded.includes(String(a).toLowerCase()),
        ),
    );
  }
  // text search
  if (q.q?.trim()) {
    const needle = q.q.trim().toLowerCase();
    items = items.filter((r: any) =>
      [r.title, r.description, ...(r.tags ?? [])]
        .join(" ")
        .toLowerCase()
        .includes(needle),
    );
  }

  items = sortRecipes(items, q.sort);

  const total = items.length;
  const paged = items.slice(q.offset, q.offset + q.limit);

  return NextResponse.json(
    { items: paged, total, limit: q.limit, offset: q.offset },
    {
      headers: {
        "Cache-Control": "public, max-age=60, s-maxage=300",
      },
    },
  );
}
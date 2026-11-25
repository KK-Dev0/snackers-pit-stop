import { eq } from "drizzle-orm";

import { getDb } from "../client";
import * as schema from "../schema";

type Db = ReturnType<typeof getDb>;

export async function listIngredients(db: Db = getDb()) {
  return db.select().from(schema.ingredients);
}

export async function getIngredientById(id: string, db: Db = getDb()) {
  const rows = await db
    .select()
    .from(schema.ingredients)
    .where(eq(schema.ingredients.id, id));
  return rows[0] ?? null;
}

export async function getIngredientsByIds(ids: string[], db: Db = getDb()) {
  if (ids.length === 0) return [];
  const all = await listIngredients(db);
  const set = new Set(ids);
  return all.filter((i) => set.has(i.id));
}

export async function findIngredientByName(name: string, db: Db = getDb()) {
  const normalized = name.trim().toLowerCase();
  const all = await listIngredients(db);
  return (
    all.find(
      (i) =>
        i.name.toLowerCase() === normalized ||
        (i.aliases as string[]).some((a) => a.toLowerCase() === normalized),
    ) ?? null
  );
}
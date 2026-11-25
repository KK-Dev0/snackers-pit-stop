import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { getDb } from "../client";
import * as schema from "../schema";

type Db = ReturnType<typeof getDb>;

export async function listRecipes(db: Db = getDb()) {
  return db.select().from(schema.recipes);
}

export async function getRecipeBySlug(slug: string, db: Db = getDb()) {
  const rows = await db
    .select()
    .from(schema.recipes)
    .where(eq(schema.recipes.slug, slug));
  const recipe = rows[0];
  if (!recipe) return null;
  const ingredients = await db
    .select()
    .from(schema.recipeIngredients)
    .where(eq(schema.recipeIngredients.recipeId, recipe.id));
  return { ...recipe, ingredients };
}

export async function getRecipeById(id: string, db: Db = getDb()) {
  const rows = await db
    .select()
    .from(schema.recipes)
    .where(eq(schema.recipes.id, id));
  const recipe = rows[0];
  if (!recipe) return null;
  const ingredients = await db
    .select()
    .from(schema.recipeIngredients)
    .where(eq(schema.recipeIngredients.recipeId, recipe.id));
  return { ...recipe, ingredients };
}

export async function listRecipesByDiet(diet: string, db: Db = getDb()) {
  return db.select().from(schema.recipes).where(eq(schema.recipes.diet, diet));
}

export async function listRecipeIngredients(recipeId: string, db: Db = getDb()) {
  return db
    .select()
    .from(schema.recipeIngredients)
    .where(eq(schema.recipeIngredients.recipeId, recipeId));
}

export async function searchRecipesFts(query: string, db: Db = getDb()) {
  if (!query.trim()) return [];
  try {
    const rows = await db.all(
      sql`SELECT recipe_id, bm25(recipe_fts) AS score FROM recipe_fts WHERE recipe_fts MATCH ${query}`,
    );
    return rows as Array<{ recipe_id: string; score: number }>;
  } catch {
    return [];
  }
}

// Helper used by retrieval: fetch recipes with ingredients in one go.
export async function listRecipesWithIngredients(db: Db = getDb()) {
  const recipes = await listRecipes(db);
  const result = [];
  for (const r of recipes) {
    const ingredients = await listRecipeIngredients(r.id, db);
    result.push({ ...r, ingredients });
  }
  return result;
}
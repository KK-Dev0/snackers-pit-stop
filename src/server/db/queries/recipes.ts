import { eq, inArray } from "drizzle-orm";
import { sql } from "drizzle-orm";

import { getDb } from "../client";
import * as schema from "../schema";

type Db = ReturnType<typeof getDb>;

export async function listRecipes(db: Db = getDb()) {
  return db.select().from(schema.recipes);
}

export async function getRecipeBySlug(slug: string, db: Db = getDb()) {
  const rows = await db.select().from(schema.recipes).where(eq(schema.recipes.slug, slug));
  const recipe = rows[0];
  if (!recipe) return null;
  const ingredients = await db
    .select()
    .from(schema.recipeIngredients)
    .where(eq(schema.recipeIngredients.recipeId, recipe.id));
  return { ...recipe, ingredients };
}

export async function getRecipeById(id: string, db: Db = getDb()) {
  const rows = await db.select().from(schema.recipes).where(eq(schema.recipes.id, id));
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

/** Fetch the whole catalog with one ingredients query instead of N+1 lookups. */
export async function listRecipesWithIngredients(db: Db = getDb()) {
  const recipes = await listRecipes(db);
  if (recipes.length === 0) return [];

  const rows = await db
    .select()
    .from(schema.recipeIngredients)
    .where(
      inArray(
        schema.recipeIngredients.recipeId,
        recipes.map((recipe) => recipe.id),
      ),
    );

  const byRecipe = new Map<string, (typeof rows)[number][]>();
  for (const row of rows) {
    const list = byRecipe.get(row.recipeId) ?? [];
    list.push(row);
    byRecipe.set(row.recipeId, list);
  }

  return recipes.map((recipe) => ({ ...recipe, ingredients: byRecipe.get(recipe.id) ?? [] }));
}

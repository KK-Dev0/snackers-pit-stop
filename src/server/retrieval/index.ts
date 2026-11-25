/* eslint-disable @typescript-eslint/no-explicit-any */
import { getDb } from "../db/client";
import * as recipesRepo from "../db/queries/recipes";
import * as ingredientsRepo from "../db/queries/ingredients";
import { searchRecipesFts } from "../db/queries/recipes";

import {
  isDietCompatible,
  hasAllergenConflict,
  matchesDislike,
  matchesSlot,
} from "./filters";
import { varietyScore, normalizeFtsScores, compositeScore } from "./rank";
import { createEmbeddingRanker, isEmbeddingsEnabled } from "./embeddings";
import type { RetrieveInput, RetrievedRecipe, RecipeRetriever } from "./types";

export type { RetrieveInput, RetrievedRecipe, RecipeRetriever, ScoreBreakdown } from "./types";
export { isDietCompatible, hasAllergenConflict, matchesDislike, matchesSlot } from "./filters";

async function resolvePantryIds(input: RetrieveInput, db: any): Promise<Set<string>> {
  const ids = new Set<string>(input.pantryIngredientIds ?? []);
  const ingredients = await ingredientsRepo.listIngredients(db);
  const byName = new Map<string, string>();
  for (const ing of ingredients) {
    byName.set(ing.name.toLowerCase(), ing.id);
    for (const a of ing.aliases ?? []) byName.set(String(a).toLowerCase(), ing.id);
  }
  for (const name of input.pantryNames ?? []) {
    const id = byName.get(name.toLowerCase());
    if (id) ids.add(id);
  }
  return ids;
}

export class SqliteRecipeRetriever implements RecipeRetriever {
  constructor(private db: any = getDb()) {}

  async retrieve(input: RetrieveInput): Promise<RetrievedRecipe[]> {
    const db = this.db;
    const limit = input.limit ?? 40;

    const allRecipes = await recipesRepo.listRecipesWithIngredients(db);

    // Hard filters
    const candidates = allRecipes.filter((r: any) => {
      if (!isDietCompatible(r.diet, input.diet)) return false;
      if (hasAllergenConflict(r.allergens ?? [], input.allergens ?? [])) return false;
      if (matchesDislike(r, input.dislikes ?? [])) return false;
      if (!matchesSlot(r, input.mealSlot)) return false;
      return true;
    });

    // FTS scores
    const rawFts = new Map<string, number>();
    if (input.query?.trim()) {
      const ftsRows = await searchRecipesFts(input.query, db);
      for (const row of ftsRows) {
        // bm25 is negative; magnitude = relevance
        rawFts.set(row.recipe_id, Math.abs(Number(row.score)));
      }
    }
    const ftsScores = normalizeFtsScores(rawFts);

    const pantryIds = await resolvePantryIds(input, db);

    // Pantry counts
    const pantryCounts = new Map<string, number>();
    let maxPantry = 0;
    for (const r of candidates) {
      const matched = (r.ingredients ?? []).filter((i: any) =>
        i.ingredientId && pantryIds.has(i.ingredientId),
      ).length;
      pantryCounts.set(r.id, matched);
      if (matched > maxPantry) maxPantry = matched;
    }

    const results: RetrievedRecipe[] = candidates.map((r: any) => {
      const fts = ftsScores.get(r.id) ?? 0;
      const matched = pantryCounts.get(r.id) ?? 0;
      const pantry = maxPantry > 0 ? matched / maxPantry : 0;
      const variety = varietyScore(r.id);
      const score = compositeScore(fts, pantry, variety);

      const reasons: string[] = [];
      if (matched > 0) reasons.push(`Uses ${matched} pantry item(s)`);
      if (input.query?.trim() && fts > 0) reasons.push("Text match");
      if (variety > 0.7) reasons.push("Variety");

      return { recipe: r, score, breakdown: { fts, pantry, variety }, reasons };
    });

    // Sort by score desc, then title
    results.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return String(a.recipe.title).localeCompare(String(b.recipe.title));
    });

    const sliced = results.slice(0, limit);

    const ranker = createEmbeddingRanker(isEmbeddingsEnabled());
    return ranker(sliced);
  }
}

export function createRecipeRetriever(db?: any): RecipeRetriever {
  return new SqliteRecipeRetriever(db ?? getDb());
}

// default retriever factory
export const createRetriever = createRecipeRetriever;

// Interface alias
export type RecipeRetrieverType = RecipeRetriever;
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DietType, MealSlot } from "@/lib/schemas";

export type RetrieveInput = {
  diet?: DietType;
  allergens?: string[];
  dislikes?: string[];
  mealSlot?: MealSlot;
  pantryIngredientIds?: string[];
  pantryNames?: string[];
  query?: string;
  limit?: number;
};

export type ScoreBreakdown = {
  fts: number;
  pantry: number;
  variety: number;
};

export type RetrievedRecipe = {
  recipe: any;
  score: number;
  breakdown: ScoreBreakdown;
  reasons: string[];
};

export interface RecipeRetriever {
  retrieve(input: RetrieveInput): Promise<RetrievedRecipe[]>;
}

export type EmbeddingRanker = (items: RetrievedRecipe[]) => Promise<RetrievedRecipe[]>;
/* eslint-disable @typescript-eslint/no-explicit-any */
import type { DietType } from "@/lib/schemas";

const DIET_RANK: Record<DietType, number> = {
  vegan: 0,
  veg: 1,
  eggetarian: 2,
  nonveg: 3,
};

/** Whether a recipe diet is compatible with a user diet. */
export function isDietCompatible(recipeDiet: string, userDiet?: DietType): boolean {
  if (!userDiet) return true;
  const recipeRank = DIET_RANK[recipeDiet as DietType];
  const userRank = DIET_RANK[userDiet];
  if (recipeRank === undefined || userRank === undefined) return true;
  return recipeRank <= userRank;
}

export function hasAllergenConflict(recipeAllergens: string[], userAllergens: string[]): boolean {
  if (!userAllergens?.length) return false;
  const set = new Set(userAllergens.map((a) => a.toLowerCase()));
  return (recipeAllergens ?? []).some((a) => set.has(String(a).toLowerCase()));
}

export function matchesDislike(recipe: any, dislikes: string[]): boolean {
  if (!dislikes?.length) return false;
  const haystack = [
    recipe.title ?? "",
    recipe.description ?? "",
    ...(recipe.ingredients ?? []).map((i: any) => i.rawName ?? ""),
  ]
    .join(" ")
    .toLowerCase();
  return dislikes.some((d) => d && haystack.includes(d.toLowerCase()));
}

export function matchesSlot(recipe: any, slot?: string): boolean {
  if (!slot) return true;
  return (recipe.mealSlots ?? []).includes(slot);
}
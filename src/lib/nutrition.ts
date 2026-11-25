import { convertQuantity } from "./units";
import type { Ingredient } from "@/lib/schemas";

export type NutritionEstimate = {
  kcal: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  sodiumMg: number;
  isEstimate: true;
};

function round(value: number, decimals = 0): number {
  const factor = 10 ** decimals;
  return Math.round(value * factor) / factor;
}

/**
 * Compute nutrition for a given ingredient quantity.
 * Returns null when the unit is incompatible with the ingredient's base unit.
 */
export function computeNutrition(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
): NutritionEstimate | null {
  const baseQty = convertQuantity(
    quantity,
    unit,
    ingredient.baseUnit,
    ingredient.pieceGrams ?? undefined,
  );
  if (baseQty === null) return null;

  let grams = baseQty;
  if (ingredient.baseUnit === "piece") {
    grams = baseQty * (ingredient.pieceGrams ?? 0);
  }
  // For volume ingredients, treat ml as grams (density ~1) for estimate.
  const factor = grams / 100;

  return {
    kcal: round(ingredient.kcalPer100 * factor),
    proteinG: round(ingredient.proteinGPer100 * factor, 1),
    carbsG: round(ingredient.carbsGPer100 * factor, 1),
    fatG: round(ingredient.fatGPer100 * factor, 1),
    fiberG: round(ingredient.fiberGPer100 * factor, 1),
    sodiumMg: round(ingredient.sodiumMgPer100 * factor),
    isEstimate: true,
  };
}

export function calculateNutrition(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
): NutritionEstimate | null {
  return computeNutrition(ingredient, quantity, unit);
}

export function calculateCalories(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
): number | null {
  const n = computeNutrition(ingredient, quantity, unit);
  return n ? n.kcal : null;
}

export function nutritionForIngredient(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
): NutritionEstimate | null {
  return computeNutrition(ingredient, quantity, unit);
}

// Recipe-level aggregation helper
export function recipeNutrition(
  recipeIngredients: Array<{
    ingredient?: Ingredient | null;
    quantity: number;
    unit: string;
  }>,
  servings: number,
): NutritionEstimate {
  const total: NutritionEstimate = {
    kcal: 0,
    proteinG: 0,
    carbsG: 0,
    fatG: 0,
    fiberG: 0,
    sodiumMg: 0,
    isEstimate: true,
  };
  for (const ri of recipeIngredients) {
    if (!ri.ingredient) continue;
    const n = computeNutrition(ri.ingredient, ri.quantity, ri.unit);
    if (!n) continue;
    total.kcal += n.kcal;
    total.proteinG = round(total.proteinG + n.proteinG, 1);
    total.carbsG = round(total.carbsG + n.carbsG, 1);
    total.fatG = round(total.fatG + n.fatG, 1);
    total.fiberG = round(total.fiberG + n.fiberG, 1);
    total.sodiumMg += n.sodiumMg;
  }
  if (servings > 0) {
    total.kcal = round(total.kcal / servings);
    total.proteinG = round(total.proteinG / servings, 1);
    total.carbsG = round(total.carbsG / servings, 1);
    total.fatG = round(total.fatG / servings, 1);
    total.fiberG = round(total.fiberG / servings, 1);
    total.sodiumMg = round(total.sodiumMg / servings);
  }
  return total;
}
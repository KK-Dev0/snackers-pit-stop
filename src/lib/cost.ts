import { convertQuantity } from "./units";
import type { Ingredient, PriceBasis } from "@/lib/schemas";

export type PriceOverride = {
  priceInr: number;
  priceBasis: PriceBasis;
};

function basisAmount(basis: PriceBasis): number {
  if (basis === "piece") return 1;
  return 100;
}

/**
 * Cost in INR for a single ingredient quantity.
 */
export function ingredientCost(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
  override?: PriceOverride,
): number | null {
  const price = override?.priceInr ?? ingredient.defaultPriceInr;
  const basis = override?.priceBasis ?? ingredient.priceBasis;

  // Convert input quantity to the ingredient's base unit.
  const baseQty = convertQuantity(
    quantity,
    unit,
    ingredient.baseUnit,
    ingredient.pieceGrams ?? undefined,
  );
  if (baseQty === null) return null;

  // Convert base unit to price basis unit if needed.
  // price basis aligns with base unit in seeded data; handle conversion anyway.
  const basisQty = convertQuantity(
    baseQty,
    ingredient.baseUnit,
    basis === "100g" ? "g" : basis === "100ml" ? "ml" : "piece",
    ingredient.pieceGrams ?? undefined,
  );
  if (basisQty === null) return null;

  const amount = basisAmount(basis);
  return (price * basisQty) / amount;
}

export function calculateIngredientCost(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
  override?: PriceOverride,
): number | null {
  return ingredientCost(ingredient, quantity, unit, override);
}

export function costForIngredient(
  ingredient: Ingredient,
  quantity: number,
  unit: string,
  override?: PriceOverride,
): number | null {
  return ingredientCost(ingredient, quantity, unit, override);
}

export type RecipeCostResult = {
  total: number;
  perServing: number;
};

export function recipeCost(
  recipeIngredients: Array<{
    ingredient?: Ingredient | null;
    quantity: number;
    unit: string;
  }>,
  servings: number,
  overrides?: Map<string, PriceOverride> | Record<string, PriceOverride>,
): RecipeCostResult {
  let total = 0;
  for (const ri of recipeIngredients) {
    if (!ri.ingredient) continue;
    const override =
      overrides instanceof Map
        ? overrides.get(ri.ingredient.id)
        : overrides?.[ri.ingredient.id];
    const c = ingredientCost(ri.ingredient, ri.quantity, ri.unit, override);
    if (c !== null) total += c;
  }
  const perServing = servings > 0 ? total / servings : total;
  return { total: round2(total), perServing: round2(perServing) };
}

export function calculateRecipeCost(
  recipeIngredients: Array<{
    ingredient?: Ingredient | null;
    quantity: number;
    unit: string;
  }>,
  servings: number,
  overrides?: Map<string, PriceOverride> | Record<string, PriceOverride>,
): RecipeCostResult {
  return recipeCost(recipeIngredients, servings, overrides);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}
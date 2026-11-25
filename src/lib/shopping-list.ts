import { matchIngredientByName, normalizeIngredientName } from "./ingredient-match";
import { slugify } from "./slug";
import { convertQuantity, unitFamily } from "./units";
import type { Aisle, Ingredient, Unit } from "./schemas";

export type MergeableIngredient = {
  name: string;
  ingredientId?: string | null;
  quantity: number;
  unit: Unit;
  aisle?: Aisle;
};

export type MergedIngredient = {
  key: string;
  name: string;
  ingredientId: string | null;
  quantity: number;
  unit: Unit;
  aisle: Aisle;
  ingredient: Ingredient | null;
};

/** Resolve an id, canonical name or alias to a catalog ingredient. */
export function resolveIngredient(
  name: string,
  ingredientId: string | null | undefined,
  ingredients: Ingredient[],
): Ingredient | null {
  if (ingredientId) {
    const byId = ingredients.find((ingredient) => ingredient.id === ingredientId);
    if (byId) return byId;
  }
  const needle = normalizeIngredientName(name);
  if (!needle) return null;
  const exact = ingredients.find((ingredient) =>
    [ingredient.name, ...ingredient.aliases].some(
      (value) => normalizeIngredientName(value) === needle,
    ),
  );
  return exact ?? matchIngredientByName(name, ingredients);
}

/** Every ingredient group is stored in one stable base unit per unit family. */
export function canonicalUnitFor(unit: Unit, ingredient?: Ingredient | null): Unit {
  if (ingredient) return ingredient.baseUnit;
  const family = unitFamily(unit);
  if (family === "mass") return "g";
  if (family === "volume") return "ml";
  if (family === "count") return "piece";
  return unit;
}

/**
 * Deterministic shopping-list key: slug of the normalized name plus the
 * canonical unit. The same key survives plan regeneration so check-offs stick.
 */
export function ingredientKey(
  input: Pick<MergeableIngredient, "name" | "ingredientId" | "unit">,
  ingredients: Ingredient[],
): string {
  const ingredient = resolveIngredient(input.name, input.ingredientId, ingredients);
  const label = ingredient?.name || normalizeIngredientName(input.name) || "unknown";
  return `${slugify(label)}:${canonicalUnitFor(input.unit, ingredient)}`;
}

/** Convert a single line to its canonical name, unit and quantity. */
export function canonicalizeIngredient(
  input: MergeableIngredient,
  ingredients: Ingredient[],
): MergedIngredient | null {
  if (!Number.isFinite(input.quantity) || input.quantity <= 0) return null;
  const ingredient = resolveIngredient(input.name, input.ingredientId, ingredients);
  const converted = convertQuantity(
    input.quantity,
    input.unit,
    canonicalUnitFor(input.unit, ingredient),
    ingredient?.pieceGrams ?? undefined,
  );
  // Incompatible or unknown units keep their original values rather than guessing.
  const unit = converted === null ? input.unit : canonicalUnitFor(input.unit, ingredient);
  const label = ingredient?.name || normalizeIngredientName(input.name) || input.name;
  return {
    key: `${slugify(label)}:${unit}`,
    name: label,
    ingredientId: ingredient?.id ?? input.ingredientId ?? null,
    quantity: converted === null ? input.quantity : converted,
    unit,
    aisle: ingredient?.aisle ?? input.aisle ?? "other",
    ingredient,
  };
}

/**
 * Merge duplicate ingredients after alias resolution and unit conversion.
 * Order follows first appearance, which keeps the list predictable.
 */
export function mergeIngredients(
  inputs: MergeableIngredient[],
  ingredients: Ingredient[],
): MergedIngredient[] {
  const merged = new Map<string, MergedIngredient>();
  for (const input of inputs) {
    const item = canonicalizeIngredient(input, ingredients);
    if (!item) continue;
    const existing = merged.get(item.key);
    if (existing) {
      existing.quantity += item.quantity;
      if (!existing.ingredient && item.ingredient) existing.ingredient = item.ingredient;
      if (existing.aisle === "other" && item.aisle !== "other") existing.aisle = item.aisle;
    } else {
      merged.set(item.key, item);
    }
  }
  return [...merged.values()];
}

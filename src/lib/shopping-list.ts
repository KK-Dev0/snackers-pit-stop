import { ingredientCost, type PriceOverride } from "./cost";
import { matchIngredientByName, normalizeIngredientName } from "./ingredient-match";
import { computeNutrition } from "./nutrition";
import { slugify } from "./slug";
import { convertQuantity, unitFamily } from "./units";
import type { Aisle, Ingredient, PantryItem, ShoppingItem, ShoppingList, Unit } from "./schemas";

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

export type PlanMealForList = {
  recipeId: string;
  /** Servings actually planned for this meal. */
  servings: number;
  /** Servings the recipe quantities were written for. */
  baseServings: number;
  ingredients: Array<{
    rawName: string;
    ingredientId?: string | null;
    quantity: number;
    unit: Unit;
  }>;
};

export type GenerateShoppingListInput = {
  planId: string;
  meals: PlanMealForList[];
  ingredients: Ingredient[];
  priceOverrides?: Map<string, PriceOverride> | Record<string, PriceOverride>;
};

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Scale every planned meal to its servings, then merge duplicate ingredients.
 * Estimates are attached only when the line matched a catalog ingredient.
 */
export function generateShoppingList(input: GenerateShoppingListInput): ShoppingList {
  const lines: MergeableIngredient[] = [];
  for (const meal of input.meals) {
    const scale = meal.baseServings > 0 ? meal.servings / meal.baseServings : 1;
    for (const item of meal.ingredients) {
      lines.push({
        name: item.rawName,
        ingredientId: item.ingredientId ?? null,
        quantity: item.quantity * scale,
        unit: item.unit,
      });
    }
  }

  const items: ShoppingItem[] = mergeIngredients(lines, input.ingredients).map((item) => {
    const override =
      input.priceOverrides instanceof Map
        ? input.priceOverrides.get(item.ingredientId ?? "")
        : item.ingredientId
          ? input.priceOverrides?.[item.ingredientId]
          : undefined;
    const cost = item.ingredient
      ? ingredientCost(item.ingredient, item.quantity, item.unit, override)
      : null;
    const kcal = item.ingredient
      ? computeNutrition(item.ingredient, item.quantity, item.unit)?.kcal
      : null;
    return {
      key: item.key,
      name: item.name,
      ingredientId: item.ingredientId,
      quantity: round2(item.quantity),
      unit: item.unit,
      aisle: item.aisle,
      checked: false,
      estimatedCostInr: cost === null ? undefined : round2(cost),
      estimatedKcal: kcal ?? undefined,
    };
  });

  return {
    planId: input.planId,
    items,
    includeStaples: false,
    checkedKeys: [],
    removedKeys: [],
    customItems: [],
  };
}

export const buildShoppingList = generateShoppingList;

export type SubtractPantryOptions = {
  pantry: PantryItem[];
  ingredients: Ingredient[];
  /** By default staples are assumed to be on hand and left off the list. */
  includeStaples?: boolean;
};

function isStapleItem(item: ShoppingItem, options: SubtractPantryOptions): boolean {
  const catalogItem = item.ingredientId
    ? options.ingredients.find((ingredient) => ingredient.id === item.ingredientId)
    : undefined;
  if (catalogItem?.isStaple) return true;
  const name = normalizeIngredientName(item.name);
  return options.pantry.some(
    (entry) => entry.isStaple && normalizeIngredientName(entry.name) === name,
  );
}

/**
 * Subtract what is already on the shelf. Full matches disappear; partial
 * matches reduce both the quantity and its cost/kcal estimates proportionally.
 */
export function subtractPantry(
  items: ShoppingItem[],
  options: SubtractPantryOptions,
): ShoppingItem[] {
  const remaining: ShoppingItem[] = [];
  for (const item of items) {
    const staple = isStapleItem(item, options);
    if (staple && !options.includeStaples) continue;

    const name = normalizeIngredientName(item.name);
    const ingredient = item.ingredientId
      ? options.ingredients.find((value) => value.id === item.ingredientId) ?? null
      : null;
    const matches = options.pantry.filter((entry) => {
      if (item.ingredientId && entry.ingredientId) {
        return entry.ingredientId === item.ingredientId;
      }
      return normalizeIngredientName(entry.name) === name;
    });

    let available = 0;
    for (const entry of matches) {
      const converted = convertQuantity(
        entry.quantity,
        entry.unit,
        item.unit,
        ingredient?.pieceGrams ?? undefined,
      );
      if (converted !== null && Number.isFinite(converted)) available += converted;
    }

    const left = item.quantity - available;
    if (left <= 0.001) continue;
    const ratio = item.quantity > 0 ? Math.min(1, left / item.quantity) : 1;
    remaining.push({
      ...item,
      quantity: round2(left),
      estimatedCostInr:
        item.estimatedCostInr === undefined ? undefined : round2(item.estimatedCostInr * ratio),
      estimatedKcal:
        item.estimatedKcal === undefined ? undefined : Math.round(item.estimatedKcal * ratio),
    });
  }
  return remaining;
}

/** Convenience wrapper that keeps the rest of a generated list intact. */
export function subtractPantryFromList(
  list: ShoppingList,
  options: SubtractPantryOptions,
): ShoppingList {
  return { ...list, items: subtractPantry(list.items, options) };
}

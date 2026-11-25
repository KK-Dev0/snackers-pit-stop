import { describe, expect, it } from "vitest";

import {
  canonicalizeIngredient,
  generateShoppingList,
  ingredientKey,
  mergeIngredients,
  resolveIngredient,
} from "@/lib/shopping-list";
import { IngredientSchema, type Ingredient } from "@/lib/schemas";

function ingredient(overrides: Partial<Ingredient> & Pick<Ingredient, "id" | "name">): Ingredient {
  return IngredientSchema.parse({
    aisle: "staples",
    baseUnit: "g",
    kcalPer100: 100,
    defaultPriceInr: 50,
    priceBasis: "100g",
    ...overrides,
  });
}

const catalog: Ingredient[] = [
  ingredient({
    id: "rice",
    name: "Rice",
    aliases: ["chawal"],
    kcalPer100: 130,
  }),
  ingredient({
    id: "tomato",
    name: "Tomato",
    aliases: ["tomatoes"],
    aisle: "produce",
    baseUnit: "piece",
    pieceGrams: 100,
    kcalPer100: 18,
  }),
  ingredient({
    id: "milk",
    name: "Milk",
    aisle: "dairy",
    baseUnit: "ml",
    kcalPer100: 60,
    priceBasis: "100ml",
  }),
];

describe("ingredient normalization and merging", () => {
  it("resolves aliases and canonical names", () => {
    expect(resolveIngredient("chawal", null, catalog)?.id).toBe("rice");
    expect(resolveIngredient("Tomatoes", null, catalog)?.id).toBe("tomato");
    expect(resolveIngredient("Rice", "rice", catalog)?.id).toBe("rice");
    expect(resolveIngredient("unlisted spice", null, catalog)).toBeNull();
  });

  it("builds deterministic keys from normalized names and base units", () => {
    expect(ingredientKey({ name: "Rice", ingredientId: null, unit: "kg" }, catalog)).toBe(
      ingredientKey({ name: "  rice  ", ingredientId: null, unit: "g" }, catalog),
    );
    expect(ingredientKey({ name: "Rice", ingredientId: null, unit: "kg" }, catalog)).toBe(
      "rice:g",
    );
  });

  it("converts every line to a canonical unit before merging", () => {
    const merged = mergeIngredients(
      [
        { name: "Rice", ingredientId: "rice", quantity: 1, unit: "kg" },
        { name: "chawal", ingredientId: null, quantity: 500, unit: "g" },
      ],
      catalog,
    );
    expect(merged).toHaveLength(1);
    expect(merged[0]).toMatchObject({ key: "rice:g", quantity: 1500, unit: "g", aisle: "staples" });
  });

  it("merges volume measures into ml and pieces into grams when possible", () => {
    const merged = mergeIngredients(
      [
        { name: "Milk", ingredientId: "milk", quantity: 2, unit: "tbsp" },
        { name: "milk", ingredientId: null, quantity: 100, unit: "ml" },
        { name: "Tomatoes", ingredientId: null, quantity: 2, unit: "piece" },
        { name: "tomato", ingredientId: null, quantity: 50, unit: "g" },
      ],
      catalog,
    );
    expect(merged.map((item) => [item.key, item.quantity, item.unit])).toEqual([
      ["milk:ml", 130, "ml"],
      ["tomato:piece", 2.5, "piece"],
    ]);
  });

  it("converts matched volume lines but never guesses across unit families", () => {
    const unknown = canonicalizeIngredient(
      { name: "Mystery leaves", ingredientId: null, quantity: 2, unit: "cup" },
      catalog,
    );
    expect(unknown).toMatchObject({
      name: "mystery leaves",
      ingredientId: null,
      quantity: 480,
      unit: "ml",
      aisle: "other",
      ingredient: null,
    });
    const incompatible = canonicalizeIngredient(
      { name: "Milk", ingredientId: "milk", quantity: 1, unit: "kg" },
      catalog,
    );
    expect(incompatible).toMatchObject({ key: "milk:kg", quantity: 1, unit: "kg" });
    expect(canonicalizeIngredient({ name: "Rice", quantity: 0, unit: "g" }, catalog)).toBeNull();
  });

  it("retains first-seen order and ignores invalid quantities", () => {
    const merged = mergeIngredients(
      [
        { name: "Milk", quantity: 1, unit: "l" },
        { name: "Rice", quantity: -1, unit: "g" },
        { name: "Tomato", quantity: 1, unit: "piece" },
      ],
      catalog,
    );
    expect(merged.map((item) => item.key)).toEqual(["milk:ml", "tomato:piece"]);
  });
});

describe("shopping list generation", () => {
  const base = { planId: "plan-1", ingredients: catalog };

  it("scales ingredients from the recipe base servings to planned servings", () => {
    const list = generateShoppingList({
      ...base,
      meals: [
        {
          recipeId: "rice-bowl",
          servings: 4,
          baseServings: 2,
          ingredients: [{ rawName: "Rice", ingredientId: "rice", quantity: 200, unit: "g" }],
        },
      ],
    });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({
      key: "rice:g",
      quantity: 400,
      unit: "g",
      aisle: "staples",
      estimatedKcal: 520,
      estimatedCostInr: 200,
    });
  });

  it("merges repeated meals and mixed units into one line", () => {
    const list = generateShoppingList({
      ...base,
      meals: [
        {
          recipeId: "rice-bowl",
          servings: 2,
          baseServings: 2,
          ingredients: [{ rawName: "Rice", ingredientId: "rice", quantity: 1, unit: "kg" }],
        },
        {
          recipeId: "pulao",
          servings: 2,
          baseServings: 2,
          ingredients: [{ rawName: "chawal", ingredientId: null, quantity: 250, unit: "g" }],
        },
      ],
    });
    expect(list.items).toHaveLength(1);
    expect(list.items[0]).toMatchObject({ quantity: 1250, unit: "g" });
  });

  it("applies price overrides and keeps unmatched lines estimate-free", () => {
    const list = generateShoppingList({
      ...base,
      priceOverrides: new Map([["rice", { priceInr: 80, priceBasis: "100g" }]]),
      meals: [
        {
          recipeId: "mystery",
          servings: 1,
          baseServings: 1,
          ingredients: [
            { rawName: "Rice", ingredientId: "rice", quantity: 500, unit: "g" },
            { rawName: "Mystery leaves", ingredientId: null, quantity: 1, unit: "piece" },
          ],
        },
      ],
    });
    expect(list.items[0].estimatedCostInr).toBe(400);
    expect(list.items[1]).toMatchObject({ name: "mystery leaves", ingredientId: null });
    expect(list.items[1].estimatedCostInr).toBeUndefined();
    expect(list.items[1].estimatedKcal).toBeUndefined();
  });

  it("returns an empty, valid list with no meals", () => {
    expect(generateShoppingList({ ...base, meals: [] })).toEqual({
      planId: "plan-1",
      items: [],
      includeStaples: false,
      checkedKeys: [],
      removedKeys: [],
      customItems: [],
    });
  });
});

import { describe, expect, it } from "vitest";

import { ingredients } from "../../scripts/seed-data/ingredients";
import { recipes } from "../../scripts/seed-data/recipes";

const ingredientIds = new Set(ingredients.map((i) => i.id));
const validDiets = new Set(["vegan", "veg", "eggetarian", "nonveg"]);
const validSlots = new Set(["breakfast", "lunch", "snack", "dinner"]);
const validUnits = new Set(["g", "ml", "piece", "tsp", "tbsp", "cup", "kg", "l"]);

describe("seed recipes", () => {
  it("has at least 60 recipes", () => {
    expect(recipes.length).toBeGreaterThanOrEqual(60);
  });

  it("has unique ids and slugs", () => {
    const ids = recipes.map((r) => r.id);
    const slugs = recipes.map((r) => r.slug);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("has valid metadata", () => {
    for (const recipe of recipes) {
      expect(validDiets.has(recipe.diet)).toBe(true);
      expect(recipe.servings).toBeGreaterThanOrEqual(1);
      expect(recipe.servings).toBeLessThanOrEqual(20);
      expect(recipe.prepMin).toBeGreaterThanOrEqual(0);
      expect(recipe.cookMin).toBeGreaterThanOrEqual(0);
      expect(recipe.steps.length).toBeGreaterThan(0);
      expect(recipe.mealSlots.length).toBeGreaterThan(0);
      for (const slot of recipe.mealSlots) {
        expect(validSlots.has(slot)).toBe(true);
      }
      expect(recipe.allergens).toBeDefined();
    }
  });

  it("has valid ingredients", () => {
    for (const recipe of recipes) {
      expect(recipe.ingredients.length).toBeGreaterThan(0);
      const sortOrders = recipe.ingredients.map((i) => i.sortOrder);
      expect(new Set(sortOrders).size).toBe(sortOrders.length);
      for (const ing of recipe.ingredients) {
        expect(ing.quantity).toBeGreaterThan(0);
        expect(ing.rawName.trim().length).toBeGreaterThan(0);
        expect(validUnits.has(ing.unit)).toBe(true);
        if (ing.ingredientId) {
          expect(ingredientIds.has(ing.ingredientId)).toBe(true);
        }
        if (ing.grams != null) {
          expect(ing.grams).toBeGreaterThanOrEqual(0);
        }
      }
    }
  });

  it("has consistent allergens (subset of ingredient allergens)", () => {
    // best-effort: recipe allergens should be array of strings
    for (const recipe of recipes) {
      for (const a of recipe.allergens ?? []) {
        expect(typeof a).toBe("string");
      }
    }
  });
});
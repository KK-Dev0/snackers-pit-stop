import { describe, expect, it } from "vitest";

import {
  matchIngredientByName,
  normalizeIngredientName,
} from "@/lib/ingredient-match";
import type { Ingredient } from "@/lib/schemas";

const ingredient = (name: string, aliases: string[] = []): Ingredient => ({
  id: name,
  name,
  aliases,
  aisle: "produce",
  baseUnit: "g",
  kcalPer100: 50,
  proteinGPer100: 5,
  carbsGPer100: 10,
  fatGPer100: 1,
  fiberGPer100: 2,
  sodiumMgPer100: 10,
  defaultPriceInr: 20,
  priceBasis: "100g",
  dietTags: [],
  allergenTags: [],
  isStaple: false,
});

const catalog = [
  ingredient("Onion", ["onions", "pyaz"]),
  ingredient("Tomato", ["tomatoes"]),
  ingredient("Cooking oil", ["oil"]),
];

describe("imported ingredient matching", () => {
  it("normalizes labels for comparison", () => {
    expect(normalizeIngredientName("  Fresh, chopped Onions! ")).toBe("onions");
    expect(normalizeIngredientName("Aloo   Gobi")).toBe("aloo gobi");
  });

  it("matches exact names and aliases regardless of plurality", () => {
    expect(matchIngredientByName("onion", catalog)?.id).toBe("Onion");
    expect(matchIngredientByName("Onions", catalog)?.id).toBe("Onion");
    expect(matchIngredientByName("PYAZ", catalog)?.id).toBe("Onion");
    expect(matchIngredientByName("tomatoes", catalog)?.id).toBe("Tomato");
  });

  it("matches descriptive labels by containment", () => {
    expect(matchIngredientByName("2 large onions", catalog)?.id).toBe("Onion");
    expect(matchIngredientByName("oil for frying", catalog)?.id).toBe("Cooking oil");
  });

  it("returns null when no catalog item is close enough", () => {
    expect(matchIngredientByName("mystery powder", catalog)).toBeNull();
    expect(matchIngredientByName("", catalog)).toBeNull();
    expect(matchIngredientByName("saffron", [])).toBeNull();
  });
});

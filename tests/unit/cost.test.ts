import { describe, expect, it } from "vitest";

import type { Ingredient } from "@/lib/schemas";
import { ingredientCost, recipeCost } from "@/lib/cost";

const ing: Ingredient = {
  id: "rice",
  name: "Rice",
  aliases: [],
  aisle: "staples",
  baseUnit: "g",
  kcalPer100: 360,
  proteinGPer100: 7,
  carbsGPer100: 78,
  fatGPer100: 0.6,
  fiberGPer100: 1.3,
  sodiumMgPer100: 1,
  defaultPriceInr: 10,
  priceBasis: "100g",
  dietTags: ["vegan", "veg"],
  allergenTags: [],
  isStaple: false,
};

describe("cost math", () => {
  it("computes ingredient cost", () => {
    expect(ingredientCost(ing, 200, "g")).toBe(20);
    expect(ingredientCost(ing, 1, "kg")).toBe(100);
  });

  it("rejects incompatible units", () => {
    expect(ingredientCost(ing, 1, "ml")).toBeNull();
  });

  it("aggregates recipe cost", () => {
    const res = recipeCost(
      [{ ingredient: ing, quantity: 200, unit: "g" }],
      2,
    );
    expect(res.total).toBe(20);
    expect(res.perServing).toBe(10);
  });
});
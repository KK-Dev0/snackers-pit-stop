import { describe, expect, it } from "vitest";

import { ingredients } from "../../scripts/seed-data/ingredients";
import { stores, pincodeStores } from "../../scripts/seed-data/stores";

describe("seed ingredients", () => {
  it("has unique ids and names", () => {
    const ids = ingredients.map((i) => i.id);
    const names = ingredients.map((i) => i.name);
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(names).size).toBe(names.length);
  });

  it("has a realistic catalog size", () => {
    expect(ingredients.length).toBeGreaterThanOrEqual(140);
  });

  it("has sane nutrition and price values", () => {
    for (const ingredient of ingredients) {
      expect(ingredient.kcalPer100).toBeGreaterThanOrEqual(0);
      expect(ingredient.kcalPer100).toBeLessThanOrEqual(950);
      expect(ingredient.defaultPriceInr).toBeGreaterThan(0);
      expect(["g", "ml", "piece"]).toContain(ingredient.baseUnit);
      expect(["100g", "100ml", "piece"]).toContain(ingredient.priceBasis);
      if (ingredient.baseUnit === "piece") {
        expect(ingredient.pieceGrams).toBeTruthy();
        expect(ingredient.pieceGrams).toBeGreaterThan(0);
      }
      if (ingredient.baseUnit === "g") {
        expect(ingredient.priceBasis).toBe("100g");
      }
      if (ingredient.baseUnit === "ml") {
        expect(ingredient.priceBasis).toBe("100ml");
      }
      if (ingredient.baseUnit === "piece") {
        expect(ingredient.priceBasis).toBe("piece");
      }
    }
  });
});

describe("seed stores", () => {
  it("has the five seeded stores", () => {
    expect(stores.length).toBe(5);
    const ids = stores.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("has Asansol pincode availability rows", () => {
    expect(pincodeStores.length).toBeGreaterThan(0);
    for (const row of pincodeStores) {
      expect(row.pincode).toMatch(/^[1-9][0-9]{5}$/);
    }
  });
});
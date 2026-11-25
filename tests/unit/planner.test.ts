import { describe, expect, it } from "vitest";

import type { Recipe } from "@/lib/schemas";
import { generatePlan, eligibleRecipes } from "@/lib/planner";

const recipes: Recipe[] = [
  {
    id: "r1",
    slug: "r1",
    title: "Breakfast 1",
    description: "",
    cuisine: "Indian",
    diet: "veg",
    mealSlots: ["breakfast"],
    servings: 2,
    prepMin: 5,
    cookMin: 5,
    steps: ["x"],
    sourceType: "seed",
    allergens: [],
    tags: [],
  },
  {
    id: "r2",
    slug: "r2",
    title: "Lunch 1",
    description: "",
    cuisine: "Indian",
    diet: "veg",
    mealSlots: ["lunch"],
    servings: 2,
    prepMin: 5,
    cookMin: 5,
    steps: ["x"],
    sourceType: "seed",
    allergens: [],
    tags: [],
  },
  {
    id: "r3",
    slug: "r3",
    title: "Snack 1",
    description: "",
    cuisine: "Indian",
    diet: "veg",
    mealSlots: ["snack"],
    servings: 2,
    prepMin: 5,
    cookMin: 5,
    steps: ["x"],
    sourceType: "seed",
    allergens: [],
    tags: [],
  },
  {
    id: "r4",
    slug: "r4",
    title: "Dinner 1",
    description: "",
    cuisine: "Indian",
    diet: "veg",
    mealSlots: ["dinner"],
    servings: 2,
    prepMin: 5,
    cookMin: 5,
    steps: ["x"],
    sourceType: "seed",
    allergens: [],
    tags: [],
  },
];

describe("planner", () => {
  it("generates 28 meals", () => {
    const { meals } = generatePlan({ recipes, diet: "veg", seed: 1 });
    expect(meals.length).toBe(28);
  });

  it("is deterministic for same seed", () => {
    const a = generatePlan({ recipes, diet: "veg", seed: 42 });
    const b = generatePlan({ recipes, diet: "veg", seed: 42 });
    expect(a.meals.map((m) => m.recipeId)).toEqual(b.meals.map((m) => m.recipeId));
  });

  it("respects locks", () => {
    const { meals } = generatePlan({
      recipes,
      diet: "veg",
      seed: 1,
      locks: [{ dayIndex: 0, slot: "breakfast", recipeId: "r99", recipeSource: "catalog", servings: 2 }],
    });
    const locked = meals.find((m) => m.dayIndex === 0 && m.slot === "breakfast");
    expect(locked?.recipeId).toBe("r99");
    expect(locked?.locked).toBe(true);
  });

  it("filters allergens via eligibleRecipes", () => {
    const r = { ...recipes[0], id: "r-dairy", allergens: ["dairy"] } as Recipe;
    const pool = eligibleRecipes([r], "breakfast", "veg", ["dairy"]);
    expect(pool).toHaveLength(0);
  });
});
import { describe, expect, it } from "vitest";

import { sortRecipes } from "@/lib/recipe-sort";

const recipes = [
  { title: "Biryani", prepMin: 20, cookMin: 40, createdAt: 100 },
  { title: "Upma", prepMin: 5, cookMin: 10, createdAt: 300 },
  { title: "Dosa", prepMin: 15, cookMin: 20, createdAt: 200 },
];

describe("sortRecipes", () => {
  it("sorts by title alphabetically", () => {
    expect(sortRecipes(recipes, "title").map((r) => r.title)).toEqual([
      "Biryani",
      "Dosa",
      "Upma",
    ]);
  });

  it("sorts by total time ascending", () => {
    expect(sortRecipes(recipes, "time").map((r) => r.title)).toEqual([
      "Upma",
      "Dosa",
      "Biryani",
    ]);
  });

  it("sorts by most recent first by default", () => {
    expect(sortRecipes(recipes, "recent").map((r) => r.title)).toEqual([
      "Upma",
      "Dosa",
      "Biryani",
    ]);
  });

  it("does not mutate the input array", () => {
    const input = [...recipes];
    sortRecipes(input, "title");
    expect(input.map((r) => r.title)).toEqual(["Biryani", "Upma", "Dosa"]);
  });
});

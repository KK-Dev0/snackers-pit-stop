import { describe, expect, it } from "vitest";

import {
  findRecipeNodes,
  parseAmount,
  parseDurationMinutes,
  parseIngredientLine,
  parseRecipeJsonLd,
} from "@/server/import/jsonld";

const page = (data: unknown) =>
  `<!doctype html><html><head><script type='application/ld+json'>${JSON.stringify(
    data,
  )}</script></head><body>article text</body></html>`;

describe("schema.org JSON-LD parsing", () => {
  it("parses amounts, fractions, units and durations", () => {
    expect(parseAmount("1 1/2")).toBeCloseTo(1.5);
    expect(parseAmount("¾")).toBeCloseTo(0.75);
    expect(parseAmount("2/3")).toBeCloseTo(2 / 3);
    expect(parseAmount("250")).toBe(250);
    expect(parseAmount("a pinch")).toBeNull();

    expect(parseIngredientLine("1 1/2 cups atta")).toMatchObject({
      quantity: 1.5,
      unit: "cup",
      rawName: "atta",
    });
    expect(parseIngredientLine("200 g toor dal")).toMatchObject({
      quantity: 200,
      unit: "g",
      rawName: "toor dal",
    });
    expect(parseIngredientLine("2 onions")).toMatchObject({
      quantity: 2,
      unit: "piece",
      rawName: "onions",
    });
    expect(parseIngredientLine("salt to taste")).toMatchObject({
      quantity: 1,
      unit: "piece",
      rawName: "salt to taste",
    });
    expect(parseDurationMinutes("PT1H30M")).toBe(90);
    expect(parseDurationMinutes("P1DT2H")).toBe(1560);
    expect(parseDurationMinutes("nonsense")).toBe(0);
  });

  it("maps a recipe buried in a @graph with mixed @types", () => {
    const html = page({
      "@context": "https://schema.org",
      "@graph": [
        { "@type": "WebPage", name: "A food blog" },
        {
          "@type": ["HowTo", "Recipe"],
          name: "Masala Oats",
          description: "Quick weekday breakfast",
          recipeCuisine: "Indian",
          recipeYield: "2 servings",
          prepTime: "PT5M",
          cookTime: "PT10M",
          suitableForDiet: "VegetarianDiet",
          keywords: "budget, breakfast, oats",
          recipeIngredient: [
            "1 cup rolled oats",
            "1 1/2 cups water",
            "½ tsp turmeric",
            "1 onion, chopped",
          ],
          recipeInstructions: [
            { "@type": "HowToStep", text: "Roast the onions." },
            { "@type": "HowToStep", text: "Add oats and water, then simmer." },
          ],
        },
      ],
    });

    const draft = parseRecipeJsonLd(html, "https://example.com/masala-oats");
    expect(draft).not.toBeNull();
    expect(draft).toMatchObject({
      title: "Masala Oats",
      description: "Quick weekday breakfast",
      cuisine: "Indian",
      diet: "veg",
      servings: 2,
      prepMin: 5,
      cookMin: 10,
      sourceUrl: "https://example.com/masala-oats",
      tags: ["budget", "breakfast", "oats"],
    });
    expect(draft?.ingredients).toHaveLength(4);
    expect(draft?.ingredients[0]).toMatchObject({ unit: "cup", quantity: 1 });
    expect(draft?.steps).toEqual([
      "Roast the onions.",
      "Add oats and water, then simmer.",
    ]);
  });

  it("skips broken blocks and finds nested recipe mainEntity", () => {
    const html = `<script type="application/ld+json">{not json}</script>
      <script type="application/ld+json">${JSON.stringify({
        "@type": "Article",
        mainEntity: {
          "@type": "Recipe",
          name: "Egg Bhurji",
          recipeIngredient: ["3 eggs", "1 tbsp butter"],
          recipeInstructions: [
            { "@type": "HowToSection", itemListElement: [{ text: "Scramble." }] },
          ],
        },
      })}</script>`;

    const draft = parseRecipeJsonLd(html, "https://example.com/egg-bhurji");
    expect(draft?.diet).toBe("eggetarian");
    expect(draft?.allergens).toContain("egg");
    expect(draft?.allergens).toContain("dairy");
    expect(draft?.steps).toEqual(["Scramble."]);
  });

  it("infers non-veg from ingredients and handles HTML entities", () => {
    const html = `<script type="application/ld+json">${JSON.stringify({
      "@type": "Recipe",
      name: "Chicken & Rice",
      recipeYield: ["4"],
      totalTime: "PT35M",
      recipeIngredient: ["500 g chicken", "2 cups rice"],
    }).replace(/&/g, "&amp;")}</script>`;

    const draft = parseRecipeJsonLd(html, "https://example.com/chicken-rice");
    expect(draft?.title).toBe("Chicken & Rice");
    expect(draft?.diet).toBe("nonveg");
    expect(draft?.servings).toBe(4);
    expect(draft?.prepMin).toBe(0);
    expect(draft?.cookMin).toBe(35);
  });

  it("returns null when there is no usable recipe", () => {
    expect(parseRecipeJsonLd("<html><body>No data</body></html>", "https://example.com")).toBeNull();
    expect(
      parseRecipeJsonLd(page({ "@type": "Recipe", name: "Empty" }), "https://example.com"),
    ).toBeNull();
    expect(findRecipeNodes({ "@type": "Article", name: "News" })).toEqual([]);
  });
});

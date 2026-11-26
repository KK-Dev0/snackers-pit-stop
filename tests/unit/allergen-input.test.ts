import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { ALLERGENS, AllergenSchema, normalizeAllergens } from "@/lib/schemas";

const onboarding = fs.readFileSync(
  path.join(process.cwd(), "src/app/onboarding/page.tsx"),
  "utf-8",
);

describe("allergen input", () => {
  it("exposes exactly the enum values accepted by the recommend endpoint", () => {
    expect(ALLERGENS).toEqual([
      "gluten",
      "dairy",
      "nuts",
      "peanut",
      "soy",
      "egg",
      "fish",
      "shellfish",
      "sesame",
    ]);
    for (const allergen of ALLERGENS) {
      expect(AllergenSchema.safeParse(allergen).success).toBe(true);
    }
  });

  it("drops free-text placeholders and unknown values from saved profiles", () => {
    expect(normalizeAllergens(["None", "gluten", " dairy ", "peanuts", "Peanut", "soy"])).toEqual([
      "gluten",
      "dairy",
      "peanut",
      "soy",
    ]);
    expect(normalizeAllergens(["none", "N/A", "", "not sure"])).toEqual([]);
  });

  it("uses selectable chips instead of a free-text allergen field", () => {
    expect(onboarding).toContain("ALLERGENS.map((allergen) =>");
    expect(onboarding).toContain("aria-pressed={selected}");
    expect(onboarding).toContain('aria-labelledby="allergens-label"');
    expect(onboarding).not.toContain('htmlFor="allergens"');
    expect(onboarding).not.toContain('allergens as Profile["allergens"]');
  });

  it("keeps dislikes as free text because its schema accepts arbitrary strings", () => {
    expect(onboarding).toContain('htmlFor="dislikes"');
  });
});

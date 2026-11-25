import fs from "node:fs";
import path from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { AvailabilityToggle } from "@/components/stores/availability-toggle";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

describe("accessibility fixes", () => {
  it("names each store availability switch uniquely", () => {
    const html = renderToStaticMarkup(
      AvailabilityToggle({
        storeId: "store-42",
        storeName: "Annapurna Stores",
        checked: false,
        onChange: () => undefined,
      }),
    );

    expect(html).toContain('id="store-selected-store-42"');
    expect(html).toContain('for="store-selected-store-42"');
    expect(html).toContain('aria-label="Do you use Annapurna Stores here?"');
  });

  it("connects the skip link target and labels onboarding controls", () => {
    const onboarding = source("src/app/onboarding/page.tsx");
    for (const marker of [
      'id="main-content"',
      'aria-label={`Step ${step + 1} of ${STEPS.length}`}',
      'aria-labelledby="diet-label"',
      'htmlFor="servings"',
      'htmlFor="calorie-goal"',
      'htmlFor="weekly-budget"',
      'htmlFor="allergens"',
      'htmlFor="dislikes"',
    ]) {
      expect(onboarding).toContain(marker);
    }
  });

  it("keeps focus indicators and contrast tokens accessible", () => {
    const tokens = source("src/app/globals.css");
    expect(tokens).toContain("--border: #8a7a63");
    expect(tokens).toContain("--border: #77847a");
    expect(tokens).toMatch(/:focus-visible\s*\{[\s\S]*?outline: 2px solid var\(--ring\)/);

    const button = source("src/components/ui/button.tsx");
    expect(button).toContain("focus-visible:ring-ring");
    expect(button).not.toContain("focus-visible:ring-ring/50");
  });

  it("announces dynamic planner and recommendation changes", () => {
    const plan = source("src/app/(app)/plan/page.tsx");
    expect(plan).toContain('role="status" aria-live="polite"');
    expect(plan).toContain("screenReaderInstructions");
    expect(plan).toContain("announcements:");

    const suggestions = source("src/components/pantry/use-it-up.tsx");
    expect(suggestions).toContain('role="status" aria-live="polite"');
    expect(suggestions).toContain('role="alert"');
  });
});

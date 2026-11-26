import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

describe("polish states", () => {
  it("provides route error boundaries and a not-found fallback", () => {
    for (const file of [
      "src/app/error.tsx",
      "src/app/(app)/error.tsx",
      "src/app/global-error.tsx",
      "src/app/(app)/recipes/[slug]/error.tsx",
      "src/app/(app)/recipes/[slug]/not-found.tsx",
      "src/app/(app)/recipes/[slug]/loading.tsx",
    ]) {
      expect(fs.existsSync(path.join(process.cwd(), file)), file).toBe(true);
    }
    expect(source("src/app/error.tsx")).toContain("retry");
    expect(source("src/app/global-error.tsx")).toContain("<html");
  });

  it("mounts the toaster on toast-using routes and uses it for async feedback", () => {
    expect(source("src/app/(app)/layout.tsx")).toContain("<Toaster");
    expect(source("src/app/onboarding/page.tsx")).toContain("<Toaster");
    for (const file of [
      "src/app/(app)/plan/page.tsx",
      "src/app/(app)/me/page.tsx",
      "src/app/onboarding/page.tsx",
    ]) {
      expect(source(file), file).toContain("toast.");
    }
    expect(source("src/app/(app)/plan/page.tsx")).toContain("retry=");
    expect(source("src/app/(app)/me/page.tsx")).toContain("Retry");
  });

  it("uses shared skeletons that mirror the final layout", () => {
    const states = source("src/components/common/states.tsx");
    expect(states).toContain("PlanSkeleton");
    expect(states).toContain("ShoppingListSkeleton");
    expect(states).toContain("RecipeCardGridSkeleton");
    expect(source("src/app/(app)/plan/page.tsx")).toContain("<PlanSkeleton />");
    expect(source("src/components/shopping-list/shopping-list-view.tsx")).toContain(
      "<ShoppingListSkeleton />",
    );
    expect(source("src/components/recipes/recipe-browser.tsx")).toContain(
      "<RecipeCardGridSkeleton />",
    );
  });

  it("gives empty and error states an actionable next step", () => {
    expect(source("src/app/(app)/plan/page.tsx")).toContain("Complete onboarding");
    expect(source("src/components/recipes/recipe-browser.tsx")).toContain("Clear filters");
    expect(source("src/components/shopping-list/shopping-list-view.tsx")).toContain("localError");
    expect(source("src/app/onboarding/page.tsx")).toContain("storesError");
  });
});

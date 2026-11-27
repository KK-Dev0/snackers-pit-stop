import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

describe("performance guards", () => {
  it("gates WebGL on capability, not a flat desktop cutoff", () => {
    const visual = source("src/components/landing/hero-visual.tsx");
    expect(visual).not.toContain("(min-width: 1024px) and (pointer: fine)");
    expect(visual).toContain("connection?.saveData !== true");
    expect(visual).toContain("cores >= 4");
    expect(visual).toContain("memory > 2");

    const scene = source("src/components/landing/hero-scene.tsx");
    expect(scene).not.toContain('import * as THREE from "three"');
    expect(scene).toContain("CanvasTexture");
  });

  it("loads optional import forms on demand", () => {
    const panel = source("src/components/recipes/import-panel.tsx");
    expect(panel).toContain('import dynamic from "next/dynamic"');
    expect(panel.match(/dynamic\(/g)).toHaveLength(2);
  });

  it("memoizes expensive list and planner calculations", () => {
    const list = source("src/components/shopping-list/shopping-list-view.tsx");
    expect(list).toContain("const customItems = useMemo(");
    expect(list).toContain("const headerQuery = useMemo(");

    const plan = source("src/app/(app)/plan/page.tsx");
    expect(plan).toContain("const recipeMap = useMemo(");
    expect(plan).toContain("const daySummaries = useMemo(");
    expect(plan).toContain("mealBySlot.get(");
  });

  it("avoids N+1 catalog and ingredient queries", () => {
    expect(source("src/server/db/queries/recipes.ts")).toMatch(
      /inArray\(\s*schema\.recipeIngredients\.recipeId/,
    );
    expect(source("src/server/db/queries/ingredients.ts")).toContain(
      "inArray(schema.ingredients.id, ids)",
    );
  });
});

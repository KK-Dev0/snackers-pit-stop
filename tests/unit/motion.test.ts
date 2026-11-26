import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

const motionWrappers = [
  "src/components/motion/page-reveal.tsx",
  "src/components/motion/stagger-list.tsx",
  "src/components/motion/scroll-reveal.tsx",
  "src/components/motion/card-lift.tsx",
];

const screensWithReveals = [
  "src/app/(app)/plan/page.tsx",
  "src/app/(app)/me/page.tsx",
  "src/components/shopping-list/shopping-list-view.tsx",
  "src/components/recipes/local-recipe-detail.tsx",
];

describe("motion", () => {
  it("honours reduced motion globally without forking SSR markup", () => {
    expect(source("src/app/layout.tsx")).toContain('<MotionConfig reducedMotion="user">');
    for (const file of motionWrappers) {
      const markup = source(file);
      expect(markup).not.toContain("if (reduceMotion)");
    }
    expect(source("src/hooks/use-reduced-motion.ts")).toContain("useMounted()");
  });

  it("keeps app-screen motion within 400 ms", () => {
    const gauge = source("src/components/common/fuel-gauge.tsx");
    expect(gauge).toContain("motionTokens.duration.base");
    expect(gauge).toContain("durationMs}ms");
    expect(gauge).not.toContain("duration.landing");
    expect(gauge).not.toContain("600ms");
  });

  it("reveals each screen once instead of replaying on branch changes", () => {
    for (const file of screensWithReveals) {
      const occurrences = source(file).match(/<PageReveal\b/g) ?? [];
      expect(occurrences).toHaveLength(1);
    }
  });

  it("animates planner moves and gives the user an instant reduced-motion path", () => {
    const planner = source("src/app/(app)/plan/page.tsx");
    expect(planner).toContain("CSS.Transform.toString(transform)");
    expect(planner).toContain("transition-shadow duration-200");
  });

  it("shows loading placeholders immediately when recipe filters change", () => {
    const browser = source("src/components/recipes/recipe-browser.tsx");
    expect(browser).toContain("setLoading(true);\n    setExcluded(");
    expect(browser).toContain("setLoading(true);\n              setQuery(");
  });

  it("neutralises CSS animation, transitions and smooth scroll for reduced motion", () => {
    const globals = source("src/app/globals.css");
    const block = globals.slice(globals.indexOf("prefers-reduced-motion"));
    expect(block).toContain("animation-duration: 0.01ms");
    expect(block).toContain("transition-duration: 0.01ms");
    expect(block).toContain("scroll-behavior: auto");
  });
});

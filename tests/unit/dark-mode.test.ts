import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const source = (relativePath: string) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf-8");

const luminance = (hex: string) => {
  const channels = [1, 3, 5].map((start) => {
    const value = Number.parseInt(hex.slice(start, start + 2), 16) / 255;
    return value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * channels[0] + 0.7152 * channels[1] + 0.0722 * channels[2];
};

const contrast = (a: string, b: string) => {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
};

describe("dark mode", () => {
  it("keeps core dark token pairs above AA", () => {
    const globals = source("src/app/globals.css");
    const darkBlock = globals.slice(
      globals.indexOf(".dark {"),
      globals.indexOf("\n}", globals.indexOf(".dark {")),
    );
    const token = (name: string) => {
      const match = new RegExp(`--${name}:\\s*(#[0-9a-f]{6})`, "i").exec(darkBlock);
      if (!match) throw new Error(`Missing dark token --${name}`);
      return match[1];
    };

    expect(contrast(token("foreground"), token("background"))).toBeGreaterThan(4.5);
    expect(contrast(token("card-foreground"), token("card"))).toBeGreaterThan(4.5);
    expect(contrast(token("muted-foreground"), token("muted"))).toBeGreaterThan(4.5);
    expect(contrast(token("primary-foreground"), token("primary"))).toBeGreaterThan(4.5);
    expect(contrast(token("destructive-foreground"), token("destructive"))).toBeGreaterThan(4.5);
    expect(contrast(token("border"), token("card"))).toBeGreaterThanOrEqual(3);
  });

  it("uses a visible scrim and border on overlays", () => {
    for (const file of [
      "src/components/ui/dialog.tsx",
      "src/components/ui/sheet.tsx",
    ]) {
      const markup = source(file);
      expect(markup).toContain("bg-black/40 dark:bg-black/70");
    }
    for (const file of [
      "src/components/ui/dialog.tsx",
      "src/components/ui/dropdown-menu.tsx",
      "src/components/ui/select.tsx",
      "src/components/ui/card.tsx",
    ]) {
      expect(source(file)).toContain("ring-border");
    }
  });

  it("keeps destructive text readable and toasts on the resolved theme", () => {
    expect(source("src/components/ui/button.tsx")).toContain("dark:bg-destructive/10");
    expect(source("src/components/ui/dropdown-menu.tsx")).toContain(
      "dark:data-[variant=destructive]:focus:bg-destructive/10",
    );

    const sonner = source("src/components/ui/sonner.tsx");
    expect(sonner).toContain('const { resolvedTheme = "system" } = useTheme()');
    for (const variant of ["success", "info", "warning", "error"]) {
      expect(sonner).toContain(`--${variant}-bg`);
      expect(sonner).toContain(`--${variant}-text`);
      expect(sonner).toContain(`--${variant}-border`);
    }
  });

  it("syncs browser chrome with an explicit in-app theme choice", () => {
    const sync = source("src/components/providers/theme-color-sync.tsx");
    expect(sync).toContain('meta[name="theme-color"]');
    expect(source("src/app/layout.tsx")).toContain("<ThemeColorSync />");
    expect(source("src/app/manifest.ts")).toContain('theme_color: "#1f4d3a"');
  });
});

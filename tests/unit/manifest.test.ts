import { describe, expect, it } from "vitest";

import manifest from "@/app/manifest";

describe("PWA manifest", () => {
  it("declares an installable, offline-capable app", () => {
    const result = manifest();

    expect(result.name).toContain("Snackers Pit Stop");
    expect(result.short_name).toBe("Snackers");
    expect(result.start_url).toBe("/");
    expect(result.scope).toBe("/");
    expect(result.display).toBe("standalone");
    expect(result.background_color).toBe("#faf4e8");
    expect(result.theme_color).toBe("#faf4e8");
    expect(result.prefer_related_applications).toBe(false);
  });

  it("provides 192/512 icons plus a maskable icon", () => {
    const icons = manifest().icons ?? [];

    expect(icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", type: "image/png" }),
        expect.objectContaining({ sizes: "512x512", type: "image/png", purpose: "maskable" }),
      ]),
    );
  });

  it("offers shortcut entries for core actions", () => {
    expect(manifest().shortcuts?.map((shortcut) => shortcut.url)).toEqual(["/plan", "/list"]);
  });
});

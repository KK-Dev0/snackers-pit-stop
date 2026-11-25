import { describe, expect, it, vi } from "vitest";

import { formatShoppingListText, shareText } from "@/lib/sharing";
import type { ShoppingItem } from "@/lib/schemas";

function item(overrides: Partial<ShoppingItem> & Pick<ShoppingItem, "key" | "name">): ShoppingItem {
  return {
    quantity: 1,
    unit: "g",
    aisle: "other",
    checked: false,
    ...overrides,
  };
}

describe("shopping list sharing", () => {
  it("formats plain text by aisle with quantities and totals", () => {
    const text = formatShoppingListText(
      [
        item({ key: "onion", name: "Onion", aisle: "produce", quantity: 500, estimatedCostInr: 20 }),
        item({ key: "rice", name: "Rice", aisle: "staples", quantity: 1, unit: "kg", estimatedCostInr: 80 }),
      ],
      "This week's shop",
    );
    expect(text).toContain("This week's shop");
    expect(text).toContain("FRUIT & VEGETABLES\n- Onion 500 g");
    expect(text.indexOf("Onion")).toBeLessThan(text.indexOf("Rice"));
    expect(text).toContain("Approx total: ₹100 (estimates only)");
    expect(text).not.toContain("**");
  });

  it("respects saved manual order inside aisles", () => {
    const text = formatShoppingListText(
      [
        item({ key: "a", name: "First", aisle: "produce" }),
        item({ key: "b", name: "Second", aisle: "produce" }),
      ],
      "List",
      ["b", "a"],
    );
    expect(text.indexOf("Second")).toBeLessThan(text.indexOf("First"));
  });

  it("copies to the clipboard when Web Share is unavailable", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", { clipboard: { writeText } });
    expect(await shareText("hello")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hello");
    vi.unstubAllGlobals();
  });

  it("reports cancellation from a dismissed share sheet", async () => {
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new DOMException("cancelled", "AbortError")),
      clipboard: { writeText: vi.fn() },
    });
    expect(await shareText("hello")).toBe("cancelled");
    vi.unstubAllGlobals();
  });

  it("falls back to copying when sharing fails", async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal("navigator", {
      share: vi.fn().mockRejectedValue(new Error("unavailable")),
      clipboard: { writeText },
    });
    expect(await shareText("hello")).toBe("copied");
    expect(writeText).toHaveBeenCalledWith("hello");
    vi.unstubAllGlobals();
  });
});

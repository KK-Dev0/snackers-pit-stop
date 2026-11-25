import { describe, expect, it } from "vitest";

import {
  buildStoreLink,
  handoffText,
  listSearchQuery,
  storeLinksForQuery,
} from "@/lib/store-links";
import { StoreSchema, type ShoppingItem, type Store } from "@/lib/schemas";

const stores: Store[] = [
  StoreSchema.parse({
    id: "blinkit",
    name: "Blinkit",
    type: "quick_commerce",
    linkTemplate: "https://blinkit.com/s/?q={query}",
    sortOrder: 1,
  }),
  StoreSchema.parse({
    id: "kirana",
    name: "Local kirana",
    type: "local",
    linkTemplate: null,
    sortOrder: 2,
  }),
];

function item(key: string, name: string, aisle: ShoppingItem["aisle"] = "produce"): ShoppingItem {
  return { key, name, quantity: 1, unit: "g", aisle, checked: false };
}

describe("store handoff links", () => {
  it("encodes queries into store templates", () => {
    expect(buildStoreLink(stores[0].linkTemplate, "toor dal")).toBe(
      "https://blinkit.com/s/?q=toor%20dal",
    );
    expect(buildStoreLink("https://example.com/?q={query}", "  ")).toBeNull();
    expect(buildStoreLink(null, "rice")).toBeNull();
    expect(buildStoreLink("https://example.com/search", "rice")).toBeNull();
  });

  it("skips stores without a usable template", () => {
    expect(storeLinksForQuery(stores, "milk").map(({ store }) => store.id)).toEqual(["blinkit"]);
  });

  it("builds a short whole-list search query from the first unique items", () => {
    const items = [
      item("rice", "Rice", "staples"),
      item("onion", "Onion"),
      item("milk", "Milk", "dairy"),
      item("dal", "Dal", "staples"),
    ];
    expect(listSearchQuery(items)).toBe("Onion Milk Rice");
    expect(listSearchQuery(items, [], 2)).toBe("Onion Milk");
    expect(listSearchQuery([])).toBe("");
  });

  it("provides a grouped plain-text copy fallback for any store", () => {
    const text = handoffText(stores[1], [item("onion", "Onion"), item("rice", "Rice", "staples")]);
    expect(text).toBe(
      "Local kirana — shopping list\nFruit & vegetables:\n- Onion 1 g\nGrains & staples:\n- Rice 1 g",
    );
    expect(storeLinksForQuery(stores, listSearchQuery([]))).toEqual([]);
  });
});

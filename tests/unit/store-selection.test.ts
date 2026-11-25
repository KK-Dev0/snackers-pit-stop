import { describe, expect, it } from "vitest";

import {
  displayStoreName,
  isStoreSelected,
  orderStores,
  resolveHandoffStores,
  selectedStoresForHandoff,
  type StoreChoice,
} from "@/lib/store-selection";
import type { StoreWithAvailability } from "@/lib/schemas";

const store = (
  id: string,
  name: string,
  sortOrder: number,
  confirmed = false,
): StoreWithAvailability => ({
  id,
  name,
  type: id === "local-kirana" ? "local" : "quick_commerce",
  linkTemplate: id === "local-kirana" ? null : `https://example.test/?q={query}`,
  sortOrder,
  confirmedCount: confirmed ? 2 : 0,
  confirmed,
  lastConfirmedAt: null,
});

const catalog = [
  store("blinkit", "Blinkit", 0, true),
  store("zepto", "Zepto", 1),
  store("local-kirana", "Other local kirana", 4),
];

describe("store selection", () => {
  it("uses a renamed kirana only for that store", () => {
    const choices: StoreChoice[] = [
      { storeId: "local-kirana", selected: true, customName: "Ravi's store" },
    ];
    expect(displayStoreName(catalog[2], choices)).toBe("Ravi's store");
    expect(displayStoreName(catalog[0], choices)).toBe("Blinkit");
  });

  it("lets the device choice override profile and crowdsourced data", () => {
    expect(isStoreSelected("blinkit", [{ storeId: "blinkit", selected: false }], ["blinkit"])).toBe(false);
    expect(isStoreSelected("zepto", [{ storeId: "zepto", selected: true }], [])).toBe(true);
    expect(isStoreSelected("zepto", [], ["zepto"])).toBe(true);
    expect(isStoreSelected("zepto", [], [])).toBe(false);
  });

  it("orders selected stores first without hiding the rest", () => {
    const ordered = orderStores(catalog, [{ storeId: "zepto", selected: true }], []);
    expect(ordered.map((item) => item.id)).toEqual([
      "zepto",
      "blinkit",
      "local-kirana",
    ]);
    expect(ordered[0].selected).toBe(true);
  });

  it("offers every store when nothing is selected, but only picks when something is", () => {
    expect(resolveHandoffStores(catalog, [], []).map((item) => item.id)).toEqual([
      "blinkit",
      "zepto",
      "local-kirana",
    ]);
    expect(
      resolveHandoffStores(catalog, [{ storeId: "local-kirana", selected: true }], []).map(
        (item) => item.id,
      ),
    ).toEqual(["local-kirana"]);
  });

  it("builds a handoff catalog from profile picks and profile custom name", () => {
    const handoff = selectedStoresForHandoff(
      catalog,
      [],
      ["local-kirana"],
      "Ravi's store",
    );
    expect(handoff).toHaveLength(1);
    expect(handoff[0]).toMatchObject({
      id: "local-kirana",
      name: "Ravi's store",
      linkTemplate: null,
    });
    expect(handoff[0]).not.toHaveProperty("selected");
    expect(handoff[0]).not.toHaveProperty("displayName");
  });

  it("lets a device rename override the profile custom name", () => {
    const handoff = selectedStoresForHandoff(
      catalog,
      [{ storeId: "local-kirana", selected: true, customName: "Corner shop" }],
      ["local-kirana"],
      "Ravi's store",
    );
    expect(handoff.map((item) => item.name)).toEqual(["Corner shop"]);
  });
});

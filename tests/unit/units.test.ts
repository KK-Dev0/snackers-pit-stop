import { describe, expect, it } from "vitest";

import { convertQuantity, areUnitsCompatible, unitFamily } from "@/lib/units";

describe("unit conversion", () => {
  it("converts mass", () => {
    expect(convertQuantity(1, "kg", "g")).toBe(1000);
    expect(convertQuantity(500, "g", "kg")).toBe(0.5);
  });

  it("converts volume", () => {
    expect(convertQuantity(1, "cup", "ml")).toBe(240);
    expect(convertQuantity(3, "tsp", "tbsp")).toBe(1);
    expect(convertQuantity(1, "l", "ml")).toBe(1000);
  });

  it("converts piece to grams", () => {
    expect(convertQuantity(2, "piece", "g", 50)).toBe(100);
    expect(convertQuantity(100, "g", "piece", 50)).toBe(2);
  });

  it("rejects incompatible families", () => {
    expect(convertQuantity(1, "g", "ml")).toBeNull();
    expect(convertQuantity(1, "piece", "ml")).toBeNull();
    expect(areUnitsCompatible("g", "ml")).toBe(false);
  });

  it("returns same value for same unit", () => {
    expect(convertQuantity(5, "g", "g")).toBe(5);
  });

  it("reports families", () => {
    expect(unitFamily("kg")).toBe("mass");
    expect(unitFamily("cup")).toBe("volume");
    expect(unitFamily("piece")).toBe("count");
    expect(unitFamily("foo")).toBeNull();
  });
});
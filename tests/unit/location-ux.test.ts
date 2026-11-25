import { describe, expect, it } from "vitest";

import {
  geolocationErrorCode,
  geolocationErrorMessage,
  normalizePincode,
} from "@/lib/geo";

describe("location UX helpers", () => {
  it("maps browser PositionError codes to actionable states", () => {
    expect(geolocationErrorCode({ code: 1 })).toBe("permission_denied");
    expect(geolocationErrorCode({ code: 3 })).toBe("timeout");
    expect(geolocationErrorCode({ code: 2 })).toBe("unavailable");
    expect(geolocationErrorCode(undefined)).toBe("unavailable");
  });

  it("always offers a manual-pincode fallback in error copy", () => {
    for (const code of ["unsupported", "permission_denied", "timeout", "unavailable"] as const) {
      expect(geolocationErrorMessage(code)).toMatch(/pincode/i);
    }
  });

  it("accepts human-formatted pincode input", () => {
    expect(normalizePincode("713 301")).toBe("713301");
    expect(normalizePincode("PIN:713301")).toBe("713301");
    expect(normalizePincode("7133017").slice(0, 6)).toBe("713301");
  });
});

import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/geo/reverse/route";
import { GeoProviderError } from "@/server/geo/provider";

const { reverseGeocode } = vi.hoisted(() => ({ reverseGeocode: vi.fn() }));

vi.mock("@/server/geo", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/server/geo")>();
  return {
    ...actual,
    getGeoProvider: () => ({ id: "test", reverseGeocode }),
  };
});

const requestFrom = (body: unknown, ip: string) =>
  new NextRequest("https://example.test/api/geo/reverse", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

beforeEach(() => {
  reverseGeocode.mockReset();
});

describe("POST /api/geo/reverse", () => {
  it("returns only pincode, city and state", async () => {
    reverseGeocode.mockResolvedValue({
      pincode: "713301",
      city: "Asansol",
      state: "West Bengal",
    });

    const response = await POST(requestFrom({ lat: 23.68, lon: 86.95 }, "203.0.113.11"));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      pincode: "713301",
      city: "Asansol",
      state: "West Bengal",
    });
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(reverseGeocode).toHaveBeenCalledWith(23.68, 86.95);
  });

  it("rejects malformed JSON and out-of-range coordinates", async () => {
    const invalidJson = new NextRequest("https://example.test/api/geo/reverse", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.12" },
      body: "not json",
    });
    expect((await POST(invalidJson)).status).toBe(400);

    const badCoords = await POST(requestFrom({ lat: 91, lon: 86 }, "203.0.113.12"));
    expect(badCoords.status).toBe(400);
    expect((await badCoords.json()).code).toBe("invalid_request");
    expect(reverseGeocode).not.toHaveBeenCalled();
  });

  it("returns 404 when no Indian pincode can be resolved", async () => {
    reverseGeocode.mockResolvedValue(null);
    const response = await POST(requestFrom({ lat: 0, lon: 0 }, "203.0.113.13"));
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("not_supported");
  });

  it("maps provider failures to safe status codes", async () => {
    reverseGeocode.mockRejectedValue(
      new GeoProviderError("provider_unavailable", "Location service is busy."),
    );
    const response = await POST(requestFrom({ lat: 23.68, lon: 86.95 }, "203.0.113.14"));
    expect(response.status).toBe(503);
    expect((await response.json()).code).toBe("provider_unavailable");
  });

  it("rate limits per IP before calling the provider", async () => {
    reverseGeocode.mockResolvedValue({
      pincode: "713301",
      city: "Asansol",
      state: "West Bengal",
    });
    const ip = `198.51.100.${Math.floor(Math.random() * 150) + 1}`;
    for (let i = 0; i < 30; i += 1) {
      const response = await POST(requestFrom({ lat: 23.68, lon: 86.95 }, ip));
      expect(response.status).toBe(200);
    }
    const blocked = await POST(requestFrom({ lat: 23.68, lon: 86.95 }, ip));
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBe("60");
    expect(reverseGeocode).toHaveBeenCalledTimes(30);
  });
});

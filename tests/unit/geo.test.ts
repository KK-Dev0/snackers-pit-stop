import { describe, expect, it, vi } from "vitest";

import { isPincode, normalizePincode } from "@/lib/geo";
import {
  createNominatimProvider,
  createSerialGate,
  parseNominatimPayload,
} from "@/server/geo/nominatim";
import { GeoProviderError } from "@/server/geo/provider";

const nominatimResponse = {
  country_code: "in",
  address: {
    postcode: "713301",
    city: "Asansol",
    state: "West Bengal",
    country: "India",
  },
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("pincode helpers", () => {
  it("normalises manual entry and validates Indian pincodes", () => {
    expect(normalizePincode(" 713 301 ")).toBe("713301");
    expect(isPincode("713301")).toBe(true);
    expect(isPincode("013301")).toBe(false);
    expect(isPincode("71330")).toBe(false);
    expect(isPincode(normalizePincode("PIN 713301"))).toBe(true);
  });
});

describe("Nominatim payload parsing", () => {
  it("keeps only pincode, city and state", () => {
    expect(parseNominatimPayload(nominatimResponse)).toEqual({
      pincode: "713301",
      city: "Asansol",
      state: "West Bengal",
    });
  });

  it("falls back through place labels and tolerates padded postcodes", () => {
    const result = parseNominatimPayload({
      countrycode: "in",
      address: { postcode: " PIN 713301 ", town: "Burnpur", state: "West Bengal" },
    });
    expect(result).toEqual({
      pincode: "713301",
      city: "Burnpur",
      state: "West Bengal",
    });
  });

  it("rejects non-Indian addresses and missing postcodes", () => {
    expect(
      parseNominatimPayload({
        country_code: "gb",
        address: { postcode: "SW1A 1AA", city: "London" },
      }),
    ).toBeNull();
    expect(parseNominatimPayload({ address: { city: "Asansol" } })).toBeNull();
    expect(parseNominatimPayload(null)).toBeNull();
  });
});

describe("Nominatim provider", () => {
  it("identifies the app in the User-Agent and returns coarse location data", async () => {
    const fetchImpl = vi.fn<typeof fetch>(
      async () => jsonResponse(nominatimResponse),
    );
    const provider = createNominatimProvider({
      baseUrl: "https://geo.example.test/",
      userAgent: "SnackersPitStop/1.0 (test contact)",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await expect(provider.reverseGeocode(23.68, 86.95)).resolves.toEqual({
      pincode: "713301",
      city: "Asansol",
      state: "West Bengal",
    });

    const call = fetchImpl.mock.calls[0];
    const url = call[0] as URL;
    const init = call[1] ?? {};
    expect(url.pathname).toBe("/reverse");
    expect(url.searchParams.get("lat")).toBe("23.68");
    expect(url.searchParams.get("lon")).toBe("86.95");
    expect((init.headers as Record<string, string>)["user-agent"]).toContain(
      "SnackersPitStop",
    );
  });

  it("caches repeated coordinates and does not call the provider twice", async () => {
    const fetchImpl = vi.fn(async () => jsonResponse(nominatimResponse));
    const provider = createNominatimProvider({
      baseUrl: "https://geo.example.test",
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await provider.reverseGeocode(23.68, 86.95);
    await provider.reverseGeocode(23.68001, 86.95001);
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });

  it("serialises lookups at the one-request-per-second limit", async () => {
    let now = 0;
    const delays: number[] = [];
    const gate = createSerialGate(1_100, () => now, async (ms) => {
      delays.push(ms);
      now += ms;
    });
    const fetchImpl = vi.fn(async () => jsonResponse(nominatimResponse));
    const provider = createNominatimProvider({
      baseUrl: "https://geo.example.test",
      gate,
      fetchImpl: fetchImpl as unknown as typeof fetch,
    });

    await Promise.all([
      provider.reverseGeocode(23.68, 86.95),
      provider.reverseGeocode(22.57, 88.36),
    ]);
    expect(delays).toEqual([1_100]);
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it("reports invalid coordinates and provider failures distinctly", async () => {
    const provider = createNominatimProvider({
      baseUrl: "https://geo.example.test",
      fetchImpl: (async () => jsonResponse({}, 503)) as unknown as typeof fetch,
    });

    await expect(provider.reverseGeocode(91, 0)).rejects.toMatchObject({
      code: "invalid_coordinates",
    });
    await expect(provider.reverseGeocode(23.68, 86.95)).rejects.toBeInstanceOf(
      GeoProviderError,
    );
  });
});

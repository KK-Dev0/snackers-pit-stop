import { afterEach, describe, expect, it, vi } from "vitest";

import {
  hashIp,
  rateLimit,
  rateLimitRequest,
  RATE_LIMITS,
} from "@/server/rate-limit";

afterEach(() => {
  vi.useRealTimers();
});

const requestFrom = (ip: string) =>
  new Request("https://example.test/api/import/url", {
    method: "POST",
    headers: { "x-forwarded-for": ip },
  });

describe("rate limiting", () => {
  it("hashes IPs with a salt instead of storing the raw address", () => {
    const hash = hashIp("203.0.113.7");
    expect(hash).toMatch(/^[0-9a-f]{64}$/);
    expect(hash).not.toContain("203.0.113.7");
    expect(hash).toBe(hashIp("203.0.113.7"));
    expect(hash).not.toBe(hashIp("203.0.113.8"));
  });

  it("enforces a sliding window per key", () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-01-01T00:00:00Z"));
    const key = `test-window-${Date.now()}`;

    expect(rateLimit(key, 2, 1_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1_000).allowed).toBe(true);
    expect(rateLimit(key, 2, 1_000).allowed).toBe(false);

    vi.setSystemTime(new Date("2026-01-01T00:00:01.001Z"));
    expect(rateLimit(key, 2, 1_000).allowed).toBe(true);
  });

  it("keeps buckets independent", () => {
    const key = `test-independent-${Date.now()}`;
    expect(rateLimit(`${key}-a`, 1, 10_000).allowed).toBe(true);
    expect(rateLimit(`${key}-b`, 1, 10_000).allowed).toBe(true);
    expect(rateLimit(`${key}-a`, 1, 10_000).allowed).toBe(false);
  });

  it("applies the route-specific import budget per IP", () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 200) + 1}`;
    const { limit } = RATE_LIMITS["import-url"];

    for (let i = 0; i < limit; i += 1) {
      expect(rateLimitRequest(requestFrom(ip), "import-url").allowed).toBe(true);
    }
    expect(rateLimitRequest(requestFrom(ip), "import-url").allowed).toBe(false);
    expect(rateLimitRequest(requestFrom(`${ip}-other`), "import-url").allowed).toBe(
      true,
    );
  });
});

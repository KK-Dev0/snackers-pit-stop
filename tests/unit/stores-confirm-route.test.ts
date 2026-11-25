import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { POST } from "@/app/api/stores/confirm/route";

const mocks = vi.hoisted(() => ({
  getStoreById: vi.fn(),
  addConfirmation: vi.fn(),
  countByIp: vi.fn(),
  countByPincodeStore: vi.fn(),
  getAvailability: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ getDb: () => ({ mock: "db" }) }));
vi.mock("@/server/db/queries/stores", () => ({
  getStoreById: mocks.getStoreById,
  addConfirmation: mocks.addConfirmation,
  countRecentConfirmationsByIp: mocks.countByIp,
  countRecentConfirmationsByPincodeStore: mocks.countByPincodeStore,
  getAvailabilityForPincode: mocks.getAvailability,
}));

const store = {
  id: "blinkit",
  name: "Blinkit",
  type: "quick_commerce",
  linkTemplate: "https://blinkit.com/s/?q={query}",
  sortOrder: 0,
};

const requestFrom = (body: unknown, ip: string) =>
  new NextRequest("https://example.test/api/stores/confirm", {
    method: "POST",
    headers: { "x-forwarded-for": ip, "content-type": "application/json" },
    body: JSON.stringify(body),
  });

const validBody = { pincode: "713301", storeId: "blinkit" };

beforeEach(() => {
  mocks.getStoreById.mockReset().mockResolvedValue(store);
  mocks.addConfirmation.mockReset().mockResolvedValue(undefined);
  mocks.countByIp.mockReset().mockResolvedValue(0);
  mocks.countByPincodeStore.mockReset().mockResolvedValue(0);
  mocks.getAvailability.mockReset().mockResolvedValue([
    {
      store,
      pincode: "713301",
      confirmedCount: 3,
      lastConfirmedAt: 1_700_000_000_000,
      confirmed: true,
      hasRow: true,
    },
  ]);
});

describe("POST /api/stores/confirm", () => {
  it("increments the count and returns fresh availability", async () => {
    const response = await POST(requestFrom(validBody, "203.0.113.31"));
    expect(response.status).toBe(200);
    expect(response.headers.get("cache-control")).toBe("no-store");
    expect(await response.json()).toMatchObject({
      pincode: "713301",
      storeId: "blinkit",
      confirmedCount: 3,
      confirmed: true,
    });

    const [pincode, storeId, ipHash] = mocks.addConfirmation.mock.calls[0];
    expect(pincode).toBe("713301");
    expect(storeId).toBe("blinkit");
    expect(ipHash).toMatch(/^[0-9a-f]{64}$/);
    expect(ipHash).not.toContain("203.0.113.31");
  });

  it("rejects invalid JSON and invalid pincodes before touching the DB", async () => {
    const badJson = new NextRequest("https://example.test/api/stores/confirm", {
      method: "POST",
      headers: { "x-forwarded-for": "203.0.113.32" },
      body: "not json",
    });
    expect((await POST(badJson)).status).toBe(400);

    const badPincode = await POST(
      requestFrom({ pincode: "123", storeId: "blinkit" }, "203.0.113.32"),
    );
    expect(badPincode.status).toBe(400);
    expect((await badPincode.json()).code).toBe("invalid_request");
    expect(mocks.getStoreById).not.toHaveBeenCalled();
  });

  it("rejects unknown stores with 404", async () => {
    mocks.getStoreById.mockResolvedValue(null);
    const response = await POST(requestFrom(validBody, "203.0.113.33"));
    expect(response.status).toBe(404);
    expect((await response.json()).code).toBe("unknown_store");
    expect(mocks.addConfirmation).not.toHaveBeenCalled();
  });

  it("refuses a repeat vote from the same device for the same store", async () => {
    mocks.countByPincodeStore.mockResolvedValue(1);
    const response = await POST(requestFrom(validBody, "203.0.113.34"));
    expect(response.status).toBe(409);
    expect((await response.json()).code).toBe("duplicate");
    expect(mocks.addConfirmation).not.toHaveBeenCalled();
  });

  it("falls back to persisted counts when the in-memory budget is exhausted", async () => {
    mocks.countByIp.mockResolvedValue(3);
    const response = await POST(requestFrom(validBody, "203.0.113.35"));
    expect(response.status).toBe(429);
    expect(response.headers.get("retry-after")).toBe("3600");
    expect(mocks.addConfirmation).not.toHaveBeenCalled();
  });

  it("enforces three confirmations per hour per IP", async () => {
    const ip = `198.51.100.${Math.floor(Math.random() * 150) + 1}`;
    for (let i = 0; i < 3; i += 1) {
      const response = await POST(requestFrom(validBody, ip));
      expect(response.status).toBe(200);
    }
    const blocked = await POST(requestFrom(validBody, ip));
    expect(blocked.status).toBe(429);
    expect(mocks.addConfirmation).toHaveBeenCalledTimes(3);
  });
});

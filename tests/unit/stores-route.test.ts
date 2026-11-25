import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "@/app/api/stores/route";
import { StoresResponseSchema } from "@/lib/schemas";

const { listStoresMock, getAvailabilityMock } = vi.hoisted(() => ({
  listStoresMock: vi.fn(),
  getAvailabilityMock: vi.fn(),
}));

vi.mock("@/server/db/client", () => ({ getDb: () => ({}) }));
vi.mock("@/server/db/queries/stores", () => ({
  listStores: listStoresMock,
  getAvailabilityForPincode: getAvailabilityMock,
}));

const blinkit = {
  id: "blinkit",
  name: "Blinkit",
  type: "quick_commerce",
  linkTemplate: "https://blinkit.com/s/?q={query}",
  sortOrder: 0,
};
const local = {
  id: "local-kirana",
  name: "Other local kirana",
  type: "local",
  linkTemplate: null,
  sortOrder: 4,
};

const getFrom = (url: string) => GET(new NextRequest(url));

beforeEach(() => {
  listStoresMock.mockReset();
  getAvailabilityMock.mockReset();
});

describe("GET /api/stores", () => {
  it("still returns all stores when no pincode is supplied", async () => {
    listStoresMock.mockResolvedValue([blinkit, local]);

    const response = await getFrom("https://example.test/api/stores");
    const parsed = StoresResponseSchema.safeParse(await response.json());
    expect(response.status).toBe(200);
    expect(parsed.success).toBe(true);
    expect(parsed.data?.items).toHaveLength(2);
    expect(parsed.data?.items.every((item) => !item.confirmed)).toBe(true);
    expect(parsed.data?.pincode).toBeNull();
    expect(parsed.data?.hasAvailabilityData).toBe(false);
    expect(getAvailabilityMock).not.toHaveBeenCalled();
  });

  it("returns availability counts for a valid pincode", async () => {
    getAvailabilityMock.mockResolvedValue([
      {
        store: blinkit,
        pincode: "713301",
        confirmedCount: 4,
        lastConfirmedAt: 1_700_000_000_000,
        confirmed: true,
        hasRow: true,
      },
      {
        store: local,
        pincode: "713301",
        confirmedCount: 0,
        lastConfirmedAt: null,
        confirmed: false,
        hasRow: false,
      },
    ]);

    const response = await getFrom(
      "https://example.test/api/stores?pincode=713301",
    );
    const payload = await response.json();
    expect(payload.pincode).toBe("713301");
    expect(payload.hasAvailabilityData).toBe(true);
    expect(payload.items[0]).toMatchObject({
      id: "blinkit",
      confirmedCount: 4,
      confirmed: true,
    });
    expect(payload.items[1]).toMatchObject({ id: "local-kirana", confirmed: false });
    expect(getAvailabilityMock).toHaveBeenCalledWith("713301", expect.anything());
  });

  it("rejects malformed pincodes", async () => {
    const response = await getFrom("https://example.test/api/stores?pincode=123");
    expect(response.status).toBe(400);
    expect(listStoresMock).not.toHaveBeenCalled();
  });
});

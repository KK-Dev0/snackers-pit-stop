/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/server/db/schema";
import { getAvailabilityForPincode } from "@/server/db/queries/stores";

describe("store availability queries", () => {
  let db: any;

  beforeAll(async () => {
    const client = createClient({ url: "file::memory:" });
    db = drizzle(client, { schema });
    const migration = fs.readFileSync(
      path.join(process.cwd(), "drizzle", "0000_aspiring_frog_thor.sql"),
      "utf8",
    );
    for (const statement of migration.split("--> statement-breakpoint")) {
      const sql = statement.trim();
      if (sql) await client.execute(sql);
    }

    await db.insert(schema.stores).values([
      {
        id: "blinkit",
        name: "Blinkit",
        type: "quick_commerce",
        linkTemplate: "https://blinkit.com/s/?q={query}",
        sortOrder: 0,
      },
      {
        id: "local-kirana",
        name: "Other local kirana",
        type: "local",
        linkTemplate: null,
        sortOrder: 4,
      },
    ]);
    await db.insert(schema.pincodeStores).values({
      pincode: "713301",
      storeId: "blinkit",
      confirmedCount: 3,
      lastConfirmedAt: 1_700_000_000_000,
    });
  });

  it("reports confirmed and unconfirmed stores for a known pincode", async () => {
    const rows = await getAvailabilityForPincode("713301", db);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({
      confirmedCount: 3,
      confirmed: true,
      hasRow: true,
    });
    expect(rows[0].store.id).toBe("blinkit");
    expect(rows[1]).toMatchObject({ confirmedCount: 0, confirmed: false, hasRow: false });
  });

  it("never hides stores for an unknown pincode", async () => {
    const rows = await getAvailabilityForPincode("110001", db);
    expect(rows).toHaveLength(2);
    expect(rows.every((row) => !row.confirmed && !row.hasRow)).toBe(true);
    expect(rows.map((row) => row.pincode)).toEqual(["110001", "110001"]);
  });
});

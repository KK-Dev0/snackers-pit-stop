/* eslint-disable @typescript-eslint/no-explicit-any */
import fs from "node:fs";
import path from "node:path";

import { createClient } from "@libsql/client";
import { drizzle } from "drizzle-orm/libsql";
import { beforeAll, describe, expect, it } from "vitest";

import * as schema from "@/server/db/schema";
import {
  addConfirmation,
  countRecentConfirmationsByIp,
  countRecentConfirmationsByPincodeStore,
  getAvailabilityForPincode,
} from "@/server/db/queries/stores";

describe("store confirmation storage", () => {
  let db: any;
  let client: ReturnType<typeof createClient>;

  beforeAll(async () => {
    client = createClient({ url: "file::memory:" });
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
  });

  it("stores an IP hash, not the raw address, and increments the count", async () => {
    const now = Date.now();
    await addConfirmation("713301", "blinkit", "hashed-device-a", db);
    await addConfirmation("713301", "blinkit", "hashed-device-b", db);

    const rows = await client.execute(
      "SELECT ip_hash FROM store_confirmations ORDER BY id",
    );
    expect(rows.rows.map((row) => row.ip_hash)).toEqual([
      "hashed-device-a",
      "hashed-device-b",
    ]);

    const availability = await getAvailabilityForPincode("713301", db);
    expect(availability[0]).toMatchObject({
      confirmedCount: 2,
      confirmed: true,
      hasRow: true,
    });
    expect(availability[0].lastConfirmedAt).toBeGreaterThanOrEqual(now - 1_000);
    expect(availability[1]).toMatchObject({ confirmedCount: 0, hasRow: false });

    expect(await countRecentConfirmationsByIp("hashed-device-a", now - 60_000, db)).toBe(1);
    expect(
      await countRecentConfirmationsByPincodeStore(
        "713301",
        "blinkit",
        "hashed-device-b",
        now - 60_000,
        db,
      ),
    ).toBe(1);
  });

  it("creates a pincode row for a previously unconfirmed store", async () => {
    await addConfirmation("713301", "local-kirana", "hashed-device-c", db);
    const availability = await getAvailabilityForPincode("713301", db);
    expect(availability[1]).toMatchObject({ confirmedCount: 1, confirmed: true });
  });

  it("ignores confirmations outside the requested window", async () => {
    await client.execute({
      sql: "INSERT INTO store_confirmations (pincode, store_id, ip_hash, created_at) VALUES (?, ?, ?, ?)",
      args: ["110001", "blinkit", "hashed-old", Date.now() - 7_200_000],
    });
    expect(
      await countRecentConfirmationsByIp("hashed-old", Date.now() - 3_600_000, db),
    ).toBe(0);
    expect(
      await countRecentConfirmationsByPincodeStore(
        "110001",
        "blinkit",
        "hashed-old",
        Date.now() - 3_600_000,
        db,
      ),
    ).toBe(0);
  });
});

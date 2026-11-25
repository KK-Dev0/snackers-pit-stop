import { sql } from "drizzle-orm";
import { index, integer, real, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const ingredients = sqliteTable(
  "ingredients",
  {
    id: text("id").primaryKey(),
    name: text("name").notNull().unique(),
    aliases: text("aliases", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    aisle: text("aisle").notNull(),
    baseUnit: text("base_unit").notNull(),
    pieceGrams: real("piece_grams"),
    kcalPer100: real("kcal_per_100").notNull(),
    proteinGPer100: real("protein_g_per_100").notNull().default(0),
    carbsGPer100: real("carbs_g_per_100").notNull().default(0),
    fatGPer100: real("fat_g_per_100").notNull().default(0),
    fiberGPer100: real("fiber_g_per_100").notNull().default(0),
    sodiumMgPer100: real("sodium_mg_per_100").notNull().default(0),
    defaultPriceInr: real("default_price_inr").notNull(),
    priceBasis: text("price_basis").notNull(),
    dietTags: text("diet_tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    allergenTags: text("allergen_tags", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    isStaple: integer("is_staple", { mode: "boolean" })
      .notNull()
      .default(false),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("ingredients_name_idx").on(table.name),
    index("ingredients_aisle_idx").on(table.aisle),
    index("ingredients_is_staple_idx").on(table.isStaple),
  ],
);

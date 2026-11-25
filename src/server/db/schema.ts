import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

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

export const recipes = sqliteTable(
  "recipes",
  {
    id: text("id").primaryKey(),
    slug: text("slug").notNull().unique(),
    title: text("title").notNull(),
    description: text("description").notNull(),
    cuisine: text("cuisine").notNull(),
    diet: text("diet").notNull(),
    mealSlots: text("meal_slots", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    servings: integer("servings").notNull(),
    prepMin: integer("prep_min").notNull(),
    cookMin: integer("cook_min").notNull(),
    steps: text("steps", { mode: "json" }).$type<string[]>().notNull().default([]),
    imageUrl: text("image_url"),
    sourceUrl: text("source_url"),
    sourceType: text("source_type").notNull(),
    allergens: text("allergens", { mode: "json" })
      .$type<string[]>()
      .notNull()
      .default([]),
    tags: text("tags", { mode: "json" }).$type<string[]>().notNull().default([]),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch() * 1000)`),
  },
  (table) => [
    index("recipes_slug_idx").on(table.slug),
    index("recipes_diet_idx").on(table.diet),
    index("recipes_cuisine_idx").on(table.cuisine),
  ],
);

export const recipeIngredients = sqliteTable(
  "recipe_ingredients",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    recipeId: text("recipe_id")
      .notNull()
      .references(() => recipes.id, { onDelete: "cascade" }),
    ingredientId: text("ingredient_id").references(() => ingredients.id, {
      onDelete: "set null",
    }),
    rawName: text("raw_name").notNull(),
    quantity: real("quantity").notNull(),
    unit: text("unit").notNull(),
    grams: real("grams"),
    optional: integer("optional", { mode: "boolean" }).notNull().default(false),
    sortOrder: integer("sort_order").notNull(),
  },
  (table) => [
    uniqueIndex("recipe_ingredients_recipe_sort_idx").on(
      table.recipeId,
      table.sortOrder,
    ),
    index("recipe_ingredients_recipe_idx").on(table.recipeId),
    index("recipe_ingredients_ingredient_idx").on(table.ingredientId),
  ],
);

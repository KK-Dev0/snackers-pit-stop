import { z } from "zod";

export const AllergenSchema = z.enum([
  "gluten",
  "dairy",
  "nuts",
  "peanut",
  "soy",
  "egg",
  "fish",
  "shellfish",
  "sesame",
]);

export const DietTypeSchema = z.enum(["vegan", "veg", "eggetarian", "nonveg"]);

export const MealSlotSchema = z.enum(["breakfast", "lunch", "snack", "dinner"]);

export const UnitSchema = z.enum([
  "g",
  "kg",
  "ml",
  "l",
  "tsp",
  "tbsp",
  "cup",
  "piece",
]);

export const AisleSchema = z.enum([
  "produce",
  "dairy",
  "staples",
  "spices",
  "protein",
  "bakery",
  "other",
]);

export const StoreTypeSchema = z.enum(["quick_commerce", "grocery", "local"]);

export const RecipeSourceTypeSchema = z.enum(["seed", "url", "photo", "llm"]);

export const RecipeSourceSchema = z.enum(["catalog", "local"]);

export const PriceBasisSchema = z.enum(["100g", "100ml", "piece"]);

export const BaseUnitSchema = z.enum(["g", "ml", "piece"]);

export type Allergen = z.infer<typeof AllergenSchema>;
export type DietType = z.infer<typeof DietTypeSchema>;
export type MealSlot = z.infer<typeof MealSlotSchema>;
export type Unit = z.infer<typeof UnitSchema>;
export type Aisle = z.infer<typeof AisleSchema>;
export type StoreType = z.infer<typeof StoreTypeSchema>;
export type RecipeSourceType = z.infer<typeof RecipeSourceTypeSchema>;
export type RecipeSource = z.infer<typeof RecipeSourceSchema>;
export type PriceBasis = z.infer<typeof PriceBasisSchema>;
export type BaseUnit = z.infer<typeof BaseUnitSchema>;
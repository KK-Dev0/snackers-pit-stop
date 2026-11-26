import { z } from "zod";

export const ALLERGENS = [
  "gluten",
  "dairy",
  "nuts",
  "peanut",
  "soy",
  "egg",
  "fish",
  "shellfish",
  "sesame",
] as const;

export const AllergenSchema = z.enum(ALLERGENS);

/**
 * Keep only known allergen tags. Older profiles saved free-text values such as
 * "None" or "peanuts"; those must never reach the strict API schema.
 */
export function normalizeAllergens(values: readonly string[]): Allergen[] {
  const seen = new Set<Allergen>();
  const result: Allergen[] = [];
  for (const value of values ?? []) {
    const candidate = value.trim().toLowerCase();
    const allergen = ALLERGENS.find((item) => item === candidate);
    if (allergen && !seen.has(allergen)) {
      seen.add(allergen);
      result.push(allergen);
    }
  }
  return result;
}

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

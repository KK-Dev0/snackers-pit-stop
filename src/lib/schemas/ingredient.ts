import { z } from "zod";

import {
  AisleSchema,
  AllergenSchema,
  BaseUnitSchema,
  DietTypeSchema,
  PriceBasisSchema,
} from "./common";

export const IngredientSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  aliases: z.array(z.string()).default([]),
  aisle: AisleSchema,
  baseUnit: BaseUnitSchema,
  pieceGrams: z.number().positive().nullable().optional(),
  kcalPer100: z.number().nonnegative(),
  proteinGPer100: z.number().nonnegative().default(0),
  carbsGPer100: z.number().nonnegative().default(0),
  fatGPer100: z.number().nonnegative().default(0),
  fiberGPer100: z.number().nonnegative().default(0),
  sodiumMgPer100: z.number().nonnegative().default(0),
  defaultPriceInr: z.number().positive(),
  priceBasis: PriceBasisSchema,
  dietTags: z.array(DietTypeSchema).default([]),
  allergenTags: z.array(AllergenSchema).default([]),
  isStaple: z.boolean().default(false),
  createdAt: z.number().optional(),
});

export const IngredientListSchema = z.array(IngredientSchema);

export type Ingredient = z.infer<typeof IngredientSchema>;
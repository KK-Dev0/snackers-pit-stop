import { z } from "zod";

import {
  AllergenSchema,
  DietTypeSchema,
  MealSlotSchema,
  RecipeSourceTypeSchema,
  UnitSchema,
} from "./common";

export const RecipeIngredientSchema = z.object({
  id: z.number().int().optional(),
  recipeId: z.string().optional(),
  ingredientId: z.string().nullable().optional(),
  rawName: z.string().min(1),
  quantity: z.number().positive(),
  unit: UnitSchema,
  grams: z.number().nonnegative().nullable().optional(),
  optional: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative(),
});

export const RecipeSchema = z.object({
  id: z.string().min(1),
  slug: z.string().min(1),
  title: z.string().min(1),
  description: z.string().default(""),
  cuisine: z.string().default(""),
  diet: DietTypeSchema,
  mealSlots: z.array(MealSlotSchema).min(1),
  servings: z.number().int().min(1).max(20),
  prepMin: z.number().int().nonnegative().default(0),
  cookMin: z.number().int().nonnegative().default(0),
  steps: z.array(z.string()).default([]),
  imageUrl: z.string().nullable().optional(),
  sourceUrl: z.string().nullable().optional(),
  sourceType: RecipeSourceTypeSchema,
  allergens: z.array(AllergenSchema).default([]),
  tags: z.array(z.string()).default([]),
  ingredients: z.array(RecipeIngredientSchema).optional(),
  createdAt: z.number().optional(),
});

export const RecipeSummarySchema = RecipeSchema.pick({
  id: true,
  slug: true,
  title: true,
  description: true,
  cuisine: true,
  diet: true,
  mealSlots: true,
  servings: true,
  prepMin: true,
  cookMin: true,
  allergens: true,
  tags: true,
});

export const RecipeDraftIngredientSchema = z.object({
  rawName: z.string().min(1),
  ingredientId: z.string().nullable().optional(),
  quantity: z.number().positive(),
  unit: UnitSchema,
  grams: z.number().nonnegative().nullable().optional(),
  optional: z.boolean().default(false),
});

export const RecipeDraftSchema = z.object({
  title: z.string().min(1),
  description: z.string().default(""),
  cuisine: z.string().default(""),
  diet: DietTypeSchema,
  mealSlots: z.array(MealSlotSchema).default(["lunch", "dinner"]),
  servings: z.number().int().min(1).max(20).default(2),
  prepMin: z.number().int().nonnegative().default(0),
  cookMin: z.number().int().nonnegative().default(0),
  steps: z.array(z.string()).default([]),
  sourceUrl: z.string().nullable().optional(),
  allergens: z.array(AllergenSchema).default([]),
  tags: z.array(z.string()).default([]),
  ingredients: z.array(RecipeDraftIngredientSchema).min(1),
});

export type RecipeIngredient = z.infer<typeof RecipeIngredientSchema>;
export type Recipe = z.infer<typeof RecipeSchema>;
export type RecipeSummary = z.infer<typeof RecipeSummarySchema>;
export type RecipeDraftIngredient = z.infer<typeof RecipeDraftIngredientSchema>;
export type RecipeDraft = z.infer<typeof RecipeDraftSchema>;
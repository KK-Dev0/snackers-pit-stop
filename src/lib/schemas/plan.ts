import { z } from "zod";

import { MealSlotSchema, RecipeSourceSchema } from "./common";

export const PlanSchema = z.object({
  id: z.string().min(1),
  weekStart: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const PlanMealSchema = z.object({
  id: z.string().min(1),
  planId: z.string().min(1),
  dayIndex: z.number().int().min(0).max(6),
  slot: MealSlotSchema,
  recipeId: z.string().min(1),
  recipeSource: RecipeSourceSchema,
  servings: z.number().int().min(1).max(20),
  locked: z.boolean().default(false),
  sortOrder: z.number().int().nonnegative().default(0),
});

export type Plan = z.infer<typeof PlanSchema>;
export type PlanMeal = z.infer<typeof PlanMealSchema>;
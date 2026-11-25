import { z } from "zod";

import { AllergenSchema, DietTypeSchema } from "./common";

export const PantryItemSchema = z.object({
  id: z.string().min(1),
  ingredientId: z.string().optional(),
  name: z.string().min(1),
  normalizedName: z.string().min(1),
  quantity: z.number().positive(),
  unit: z.enum(["g", "kg", "ml", "l", "tsp", "tbsp", "cup", "piece"]),
  isStaple: z.boolean().default(false),
  createdAt: z.number(),
  updatedAt: z.number(),
});

export const ProfileSchema = z.object({
  id: z.literal("me").default("me"),
  diet: DietTypeSchema,
  servings: z.number().int().min(1).max(20).default(2),
  calorieGoal: z.number().int().min(1200).max(4000),
  weeklyBudgetInr: z.number().min(500).max(50000),
  allergens: z.array(AllergenSchema).default([]),
  dislikes: z.array(z.string()).default([]),
  pincode: z
    .string()
    .regex(/^[1-9][0-9]{5}$/)
    .optional(),
  storeIds: z.array(z.string()).default([]),
  customStoreName: z.string().optional(),
  onboardedAt: z.number().optional(),
  updatedAt: z.number().optional(),
});

export type PantryItem = z.infer<typeof PantryItemSchema>;
export type Profile = z.infer<typeof ProfileSchema>;
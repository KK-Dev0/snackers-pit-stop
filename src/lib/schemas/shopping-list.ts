import { z } from "zod";

import { AisleSchema, UnitSchema } from "./common";

export const ShoppingItemSchema = z.object({
  key: z.string().min(1),
  name: z.string().min(1),
  ingredientId: z.string().nullable().optional(),
  quantity: z.number().nonnegative(),
  unit: UnitSchema,
  aisle: AisleSchema,
  checked: z.boolean().default(false),
  estimatedCostInr: z.number().nonnegative().optional(),
  estimatedKcal: z.number().nonnegative().optional(),
});

export const ShoppingListSchema = z.object({
  planId: z.string().min(1),
  items: z.array(ShoppingItemSchema).default([]),
  includeStaples: z.boolean().default(false),
  checkedKeys: z.array(z.string()).default([]),
  removedKeys: z.array(z.string()).default([]),
  customItems: z.array(ShoppingItemSchema).default([]),
  updatedAt: z.number().optional(),
});

export type ShoppingItem = z.infer<typeof ShoppingItemSchema>;
export type ShoppingList = z.infer<typeof ShoppingListSchema>;
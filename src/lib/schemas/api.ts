import { z } from "zod";

import { AllergenSchema, DietTypeSchema, MealSlotSchema } from "./common";

export const RecipeListQuerySchema = z.object({
  q: z.string().optional(),
  diet: DietTypeSchema.optional(),
  allergens: z.string().optional(),
  slot: MealSlotSchema.optional(),
  cuisine: z.string().optional(),
  tag: z.string().optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
});

export const RecipeBySlugParamsSchema = z.object({
  slug: z.string().min(1),
});

export const RecommendRequestSchema = z.object({
  diet: DietTypeSchema.optional(),
  allergens: z.array(AllergenSchema).default([]),
  dislikes: z.array(z.string()).default([]),
  slot: MealSlotSchema.optional(),
  pantryNames: z.array(z.string()).default([]),
  pantryIngredientIds: z.array(z.string()).default([]),
  query: z.string().optional(),
  limit: z.number().int().min(1).max(100).default(40),
});

export const GeoReverseRequestSchema = z.object({
  lat: z.number().min(-90).max(90),
  lon: z.number().min(-180).max(180),
});

export const StoresQuerySchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
});

export const ConfirmStoreRequestSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  storeId: z.string().min(1),
});

export const ImportUrlRequestSchema = z.object({
  url: z
    .url()
    .max(2_048)
    .refine((value) => ["http:", "https:"].includes(new URL(value).protocol), {
      message: "Only http(s) URLs are supported.",
    }),
});

export type RecipeListQuery = z.infer<typeof RecipeListQuerySchema>;
export type RecommendRequest = z.infer<typeof RecommendRequestSchema>;
export type GeoReverseRequest = z.infer<typeof GeoReverseRequestSchema>;
export type StoresQuery = z.infer<typeof StoresQuerySchema>;
export type ConfirmStoreRequest = z.infer<typeof ConfirmStoreRequestSchema>;
export type ImportUrlRequest = z.infer<typeof ImportUrlRequestSchema>;
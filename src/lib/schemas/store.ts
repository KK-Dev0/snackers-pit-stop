import { z } from "zod";

import { StoreTypeSchema } from "./common";

export const StoreSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  type: StoreTypeSchema,
  linkTemplate: z.string().nullable().optional(),
  sortOrder: z.number().int().default(0),
});

/** A catalog store enriched with crowdsourced availability for one pincode. */
export const StoreWithAvailabilitySchema = StoreSchema.extend({
  confirmedCount: z.number().int().nonnegative().default(0),
  confirmed: z.boolean().default(false),
  lastConfirmedAt: z.number().nullable().optional(),
});

export const StoresResponseSchema = z.object({
  items: z.array(StoreWithAvailabilitySchema),
  pincode: z.string().nullable(),
  hasAvailabilityData: z.boolean(),
});

export const StoreAvailabilitySchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  storeId: z.string().min(1),
  confirmedCount: z.number().int().nonnegative().default(0),
  lastConfirmedAt: z.number().nullable().optional(),
  confirmed: z.boolean().default(false),
});

export const ConfirmationSchema = z.object({
  pincode: z.string().regex(/^[1-9][0-9]{5}$/),
  storeId: z.string().min(1),
});

export type Store = z.infer<typeof StoreSchema>;
export type StoreWithAvailability = z.infer<typeof StoreWithAvailabilitySchema>;
export type StoresResponse = z.infer<typeof StoresResponseSchema>;
export type StoreAvailability = z.infer<typeof StoreAvailabilitySchema>;
export type Confirmation = z.infer<typeof ConfirmationSchema>;
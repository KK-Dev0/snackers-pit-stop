import { z } from "zod";

/** Indian pincodes are exactly six digits and never start with zero. */
export const PincodeSchema = z
  .string()
  .regex(/^[1-9][0-9]{5}$/, "Enter a valid 6-digit Indian pincode.");

/** The only location data we keep: a pincode and coarse place labels. */
export const GeoLocationSchema = z.object({
  pincode: PincodeSchema,
  city: z.string().nullable(),
  state: z.string().nullable(),
});

export type GeoLocation = z.infer<typeof GeoLocationSchema>;

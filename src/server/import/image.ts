import { ALLOWED_IMAGE_TYPES, MAX_IMAGE_BYTES } from "@/lib/import-constants";

export type ImageValidation =
  | { ok: true }
  | { ok: false; error: string; code: string; status: number };

/** Validate an upload before it reaches a vision model. */
export function validateImage(input: {
  type: string;
  size: number;
}): ImageValidation {
  const type = input.type.toLowerCase();
  if (!ALLOWED_IMAGE_TYPES.some((allowed) => allowed === type)) {
    return {
      ok: false,
      error: "Use a JPEG, PNG, WebP or GIF image.",
      code: "unsupported_image_type",
      status: 415,
    };
  }
  if (!Number.isFinite(input.size) || input.size <= 0) {
    return {
      ok: false,
      error: "That image is empty.",
      code: "empty_image",
      status: 400,
    };
  }
  if (input.size > MAX_IMAGE_BYTES) {
    return {
      ok: false,
      error: "Images must be 5 MB or smaller.",
      code: "image_too_large",
      status: 413,
    };
  }
  return { ok: true };
}

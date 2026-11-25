import { describe, expect, it } from "vitest";

import {
  ALLOWED_IMAGE_TYPES,
  MAX_IMAGE_BYTES,
} from "@/lib/import-constants";
import { validateImage } from "@/server/import/image";

describe("photo import validation", () => {
  it("accepts supported image types within the size cap", () => {
    for (const type of ALLOWED_IMAGE_TYPES) {
      expect(validateImage({ type, size: 1024 })).toEqual({ ok: true });
    }
    expect(validateImage({ type: "IMAGE/PNG", size: 1024 })).toEqual({ ok: true });
  });

  it("rejects unsupported formats, empty files and oversized uploads", () => {
    expect(validateImage({ type: "application/pdf", size: 1024 })).toMatchObject({
      ok: false,
      code: "unsupported_image_type",
      status: 415,
    });
    expect(validateImage({ type: "image/png", size: 0 })).toMatchObject({
      ok: false,
      code: "empty_image",
      status: 400,
    });
    expect(
      validateImage({ type: "image/png", size: MAX_IMAGE_BYTES + 1 }),
    ).toMatchObject({
      ok: false,
      code: "image_too_large",
      status: 413,
    });
  });
});

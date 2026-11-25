import { describe, expect, it } from "vitest";

import { ImportUrlRequestSchema } from "@/lib/schemas";

describe("ImportUrlRequestSchema", () => {
  it("accepts http and https URLs", () => {
    expect(ImportUrlRequestSchema.safeParse({ url: "https://example.com/recipe" }).success).toBe(
      true,
    );
    expect(ImportUrlRequestSchema.safeParse({ url: "http://example.com" }).success).toBe(true);
  });

  it("rejects malformed URLs without throwing", () => {
    for (const url of ["not-a-url", "", "example.com", "://broken"]) {
      expect(() => ImportUrlRequestSchema.safeParse({ url })).not.toThrow();
      expect(ImportUrlRequestSchema.safeParse({ url }).success).toBe(false);
    }
  });

  it("rejects non-http schemes", () => {
    for (const url of ["file:///etc/passwd", "javascript:alert(1)", "ftp://example.com"]) {
      const result = ImportUrlRequestSchema.safeParse({ url });
      expect(result.success).toBe(false);
    }
  });

  it("rejects overly long URLs", () => {
    expect(
      ImportUrlRequestSchema.safeParse({ url: `https://example.com/${"a".repeat(2_100)}` }).success,
    ).toBe(false);
  });
});

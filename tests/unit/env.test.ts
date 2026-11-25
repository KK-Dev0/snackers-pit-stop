import { describe, expect, it } from "vitest";

import {
  EnvValidationError,
  parseServerEnv,
  serverEnvSchema,
} from "@/lib/env";

describe("parseServerEnv", () => {
  it("applies safe development defaults", () => {
    const env = parseServerEnv({});

    expect(env.NODE_ENV).toBe("development");
    expect(env.DATABASE_URL).toBe("file:local.db");
    expect(env.DATABASE_AUTH_TOKEN).toBeUndefined();
    expect(env.LLM_BASE_URL).toBe("https://api.openai.com/v1");
    expect(env.LLM_MODEL).toBe("gpt-4o-mini");
    expect(env.LLM_TIMEOUT_MS).toBe(30_000);
    expect(env.LLM_MAX_TOKENS).toBe(2_048);
    expect(env.EMBEDDINGS_ENABLED).toBe(false);
    expect(env.PHOTO_IMPORT_ENABLED).toBe(false);
    expect(env.GEO_PROVIDER).toBe("nominatim");
    expect(env.RATE_LIMIT_SALT).toBe("dev-only-rate-limit-salt");
  });

  it("coerces booleans, numbers, and trims strings", () => {
    const env = parseServerEnv({
      DATABASE_URL: "  libsql://snackers.turso.io  ",
      DATABASE_AUTH_TOKEN: "  secret-token  ",
      EMBEDDINGS_ENABLED: "YES",
      PHOTO_IMPORT_ENABLED: "1",
      LLM_TIMEOUT_MS: "8000",
      LLM_MAX_TOKENS: "1024",
      LLM_MODEL: "  gpt-4.1-mini  ",
      NODE_ENV: "production",
    });

    expect(env.DATABASE_URL).toBe("libsql://snackers.turso.io");
    expect(env.DATABASE_AUTH_TOKEN).toBe("secret-token");
    expect(env.EMBEDDINGS_ENABLED).toBe(true);
    expect(env.PHOTO_IMPORT_ENABLED).toBe(true);
    expect(env.LLM_TIMEOUT_MS).toBe(8_000);
    expect(env.LLM_MAX_TOKENS).toBe(1_024);
    expect(env.LLM_MODEL).toBe("gpt-4.1-mini");
    expect(env.NODE_ENV).toBe("production");
  });

  it("treats empty strings as unset", () => {
    const env = parseServerEnv({
      DATABASE_URL: "   ",
      LLM_API_KEY: "",
      LLM_VISION_MODEL: "",
      NOMINATIM_USER_AGENT: "",
    });

    expect(env.DATABASE_URL).toBe("file:local.db");
    expect(env.LLM_API_KEY).toBeUndefined();
    expect(env.LLM_VISION_MODEL).toBeUndefined();
    expect(env.NOMINATIM_USER_AGENT).toBeUndefined();
  });

  it("reports every invalid variable in one error", () => {
    let error: unknown;

    try {
      parseServerEnv({
        DATABASE_URL: "",
        EMBEDDINGS_ENABLED: "sometimes",
        LLM_BASE_URL: "not a url",
        LLM_TIMEOUT_MS: "10",
        NODE_ENV: "staging",
      });
    } catch (caught) {
      error = caught;
    }

    expect(error).toBeInstanceOf(EnvValidationError);
    const message = (error as EnvValidationError).message;
    expect(message).toContain("Invalid server environment variables:");
    expect(message).toContain("EMBEDDINGS_ENABLED");
    expect(message).toContain("LLM_BASE_URL");
    expect(message).toContain("LLM_TIMEOUT_MS");
    expect(message).toContain("NODE_ENV");
    expect(message).toContain(".env.example");
  });

  it("rejects unsupported geo providers", () => {
    const result = serverEnvSchema.safeParse({ GEO_PROVIDER: "google" });

    expect(result.success).toBe(false);
  });
});

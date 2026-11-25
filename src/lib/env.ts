import { z } from "zod";

/**
 * Server-only environment configuration.
 *
 * Never import this module from a client component. Values are validated
 * lazily so that builds and unit tests can run without a full `.env` file,
 * while a misconfigured server fails fast on the first request that needs it.
 */

const emptyToUndefined = (value: unknown) =>
  typeof value === "string" && value.trim() === "" ? undefined : value;

const optionalString = z.preprocess(
  emptyToUndefined,
  z.string().trim().min(1).optional(),
);

const booleanish = z.preprocess((value) => {
  if (typeof value !== "string") return value;

  const normalized = value.trim().toLowerCase();
  if (["true", "1", "yes", "on"].includes(normalized)) return true;
  if (["false", "0", "no", "off"].includes(normalized)) return false;

  return value;
}, z.boolean());

export const serverEnvSchema = z.object({
  NODE_ENV: z
    .preprocess(
      emptyToUndefined,
      z.enum(["development", "test", "production"]).default("development"),
    )
    .describe("Next.js runtime mode."),

  DATABASE_URL: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().min(1).default("file:local.db"),
    )
    .describe("libSQL URL. Use file:local.db locally and libsql://… on Turso."),

  DATABASE_AUTH_TOKEN: optionalString.describe(
    "Turso auth token. Omit for a local SQLite file.",
  ),

  LLM_BASE_URL: z
    .preprocess(
      emptyToUndefined,
      z.url().default("https://api.openai.com/v1"),
    )
    .describe("OpenAI-compatible base URL for the LLM wrapper."),

  LLM_API_KEY: optionalString.describe(
    "API key for the LLM provider. Required for URL/photo import.",
  ),

  LLM_MODEL: z
    .preprocess(emptyToUndefined, z.string().trim().min(1).default("gpt-4o-mini"))
    .describe("Text model used for recipe extraction fallbacks."),

  LLM_VISION_MODEL: optionalString.describe(
    "Vision model used for photo import. Falls back to LLM_MODEL.",
  ),

  LLM_TIMEOUT_MS: z.coerce
    .number()
    .int()
    .min(1_000)
    .max(120_000)
    .default(30_000)
    .describe("Hard timeout for a single LLM request."),

  LLM_MAX_TOKENS: z.coerce
    .number()
    .int()
    .min(256)
    .max(8_192)
    .default(2_048)
    .describe("Maximum completion tokens per LLM request."),

  EMBEDDINGS_ENABLED: booleanish
    .default(false)
    .describe("Rerank retrieval results with embeddings. Off by default."),

  PHOTO_IMPORT_ENABLED: booleanish
    .default(false)
    .describe("Expose photo import in the UI and API. Off by default."),

  GEO_PROVIDER: z
    .preprocess(
      emptyToUndefined,
      z.enum(["nominatim"]).default("nominatim"),
    )
    .describe("Reverse-geocoding provider."),

  NOMINATIM_BASE_URL: z
    .preprocess(
      emptyToUndefined,
      z.url().default("https://nominatim.openstreetmap.org"),
    )
    .describe("Nominatim endpoint. Self-host or keep the public instance."),

  NOMINATIM_USER_AGENT: optionalString.describe(
    "Identifying User-Agent required by the Nominatim usage policy.",
  ),

  RATE_LIMIT_SALT: z
    .preprocess(
      emptyToUndefined,
      z.string().trim().min(16).default("dev-only-rate-limit-salt"),
    )
    .describe("Salt for hashed IP rate limiting. Set a random value in production."),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

export class EnvValidationError extends Error {
  constructor(readonly issues: string[]) {
    super(
      [
        "Invalid server environment variables:",
        ...issues.map((issue) => `  - ${issue}`),
        "",
        "Copy .env.example to .env.local and fill in the required values.",
      ].join("\n"),
    );
    this.name = "EnvValidationError";
  }
}

/**
 * Validate an environment source. Exported for tests and scripts; app code
 * should use `getServerEnv()` so the result is parsed once per process.
 */
export function parseServerEnv(
  source: Record<string, string | undefined> = process.env,
): ServerEnv {
  const result = serverEnvSchema.safeParse(source);

  if (!result.success) {
    const issues = result.error.issues.map((issue) => {
      const path = issue.path.join(".") || "(root)";
      return `${path}: ${issue.message}`;
    });

    throw new EnvValidationError(issues);
  }

  return result.data;
}

let cachedEnv: ServerEnv | undefined;

export function getServerEnv(): ServerEnv {
  cachedEnv ??= parseServerEnv();
  return cachedEnv;
}

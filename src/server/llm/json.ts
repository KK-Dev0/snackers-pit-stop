import { z } from "zod";

import {
  getLlmClient,
  type ChatMessage,
  type LlmClient,
  type VisionImage,
} from "./provider";

export class JsonGenerationError extends Error {
  constructor(
    readonly reason: "invalid_json" | "validation",
    message: string,
    readonly detail?: string,
  ) {
    super(message);
    this.name = "JsonGenerationError";
  }
}

export type GenerateJsonOptions<T extends z.ZodType> = {
  schema: T;
  messages: ChatMessage[];
  images?: VisionImage[];
  temperature?: number;
  maxTokens?: number;
  /** Injectable for tests; route handlers use the configured provider. */
  client?: LlmClient;
};

function unwrapFences(text: string): string {
  const trimmed = text.trim();
  const fenced = /^```(?:json)?\s*([\s\S]*?)\s*```$/i.exec(trimmed);
  return fenced ? fenced[1] : trimmed;
}

function parse<T extends z.ZodType>(
  schema: T,
  text: string,
): { ok: true; value: z.infer<T> } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(unwrapFences(text));
  } catch {
    return { ok: false, error: "Response was not valid JSON." };
  }

  const result = schema.safeParse(json);
  if (result.success) return { ok: true, value: result.data };

  const issues = result.error.issues
    .map((issue) => `${issue.path.join(".") || "(root)"}: ${issue.message}`)
    .join("; ");
  return { ok: false, error: `Schema validation failed: ${issues}` };
}

const REPAIR_INSTRUCTION =
  "Your previous response was not acceptable. Return ONLY a JSON object that matches the requested schema — no markdown fences, no commentary, no invented values.";

/**
 * Ask the LLM for structured data and validate it with Zod. On failure, make
 * exactly one repair request that includes the validation error.
 */
export async function generateJson<T extends z.ZodType>(
  options: GenerateJsonOptions<T>,
): Promise<z.infer<T>> {
  const client = options.client ?? getLlmClient();
  const completionOptions = {
    temperature: options.temperature ?? 0.2,
    maxTokens: options.maxTokens,
  };
  const request = (messages: ChatMessage[]) =>
    options.images?.length
      ? client.vision(messages, options.images, completionOptions)
      : client.chat(messages, completionOptions);

  const first = await request(options.messages);
  const parsed = parse(options.schema, first);
  if (parsed.ok) return parsed.value;

  const repairMessages: ChatMessage[] = [
    ...options.messages,
    { role: "assistant", content: first },
    { role: "user", content: `${REPAIR_INSTRUCTION}\nReason: ${parsed.error}` },
  ];
  const second = await request(repairMessages);
  const repaired = parse(options.schema, second);
  if (repaired.ok) return repaired.value;

  throw new JsonGenerationError(
    repaired.error.startsWith("Response was not valid JSON")
      ? "invalid_json"
      : "validation",
    "LLM output was invalid after one repair attempt.",
    repaired.error,
  );
}

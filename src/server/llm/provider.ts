import { z } from "zod";

import { getServerEnv } from "@/lib/env";

/** A chat message in OpenAI-compatible format. */
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/** An image sent to a vision model, either remote or inline. */
export type VisionImage =
  | { kind: "url"; url: string }
  | { kind: "data"; mimeType: string; base64: string };

export type LlmErrorCode =
  | "configuration"
  | "timeout"
  | "network"
  | "http"
  | "invalid_response";

export class LlmError extends Error {
  constructor(
    readonly code: LlmErrorCode,
    message: string,
    readonly status?: number,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = "LlmError";
  }
}

export type LlmClientConfig = {
  baseUrl: string;
  apiKey: string;
  model: string;
  visionModel?: string;
  timeoutMs: number;
  maxTokens: number;
  fetchImpl?: typeof fetch;
};

export type CompletionOptions = {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  signal?: AbortSignal;
};

const CompletionResponseSchema = z.object({
  choices: z
    .array(
      z.object({
        message: z.object({
          content: z.string().nullable().optional(),
        }),
      }),
    )
    .min(1),
});

type CompletionRequest = {
  model: string;
  messages: Array<{
    role: ChatMessage["role"];
    content: string | Array<Record<string, unknown>>;
  }>;
  temperature: number;
  max_tokens: number;
};

function messagesWithImages(
  messages: ChatMessage[],
  images: VisionImage[],
): CompletionRequest["messages"] {
  return messages.map((message, index) => {
    if (index !== messages.length - 1 || images.length === 0) return message;

    return {
      role: message.role,
      content: [
        { type: "text", text: message.content },
        ...images.map((image): Record<string, unknown> => {
          const url =
            image.kind === "url"
              ? image.url
              : `data:${image.mimeType};base64,${image.base64}`;
          return { type: "image_url", image_url: { url } };
        }),
      ],
    };
  });
}

/**
 * Provider-agnostic client for any OpenAI-compatible chat/completions API.
 * All secrets stay server-side: this module is never imported by client code.
 */
export function createLlmClient(config: LlmClientConfig) {
  const fetchImpl = config.fetchImpl ?? fetch;
  const base = config.baseUrl.replace(/\/+$/, "");

  async function complete(
    messages: ChatMessage[],
    options: CompletionOptions = {},
    images: VisionImage[] = [],
  ): Promise<string> {
    if (!config.apiKey) {
      throw new LlmError(
        "configuration",
        "LLM_API_KEY is not set. Recipe imports need a configured provider.",
      );
    }
    if (messages.length === 0) {
      throw new LlmError("invalid_response", "At least one message is required.");
    }

    const body: CompletionRequest = {
      model: options.model ?? config.model,
      messages: messagesWithImages(messages, images),
      temperature: options.temperature ?? 0.2,
      max_tokens: options.maxTokens ?? config.maxTokens,
    };

    const timeout = AbortSignal.timeout(config.timeoutMs);
    const signal = options.signal
      ? AbortSignal.any([options.signal, timeout])
      : timeout;

    let response: Response;
    try {
      response = await fetchImpl(`${base}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify(body),
        signal,
      });
    } catch (error) {
      if (signal.aborted || (error instanceof Error && error.name === "TimeoutError")) {
        throw new LlmError("timeout", `LLM request timed out after ${config.timeoutMs}ms.`);
      }
      throw new LlmError("network", "Could not reach the LLM provider.", undefined, error);
    }

    if (!response.ok) {
      throw new LlmError(
        "http",
        `LLM provider returned ${response.status}.`,
        response.status,
      );
    }

    let json: unknown;
    try {
      json = await response.json();
    } catch {
      throw new LlmError("invalid_response", "LLM provider returned invalid JSON.");
    }

    const parsed = CompletionResponseSchema.safeParse(json);
    if (!parsed.success || !parsed.data.choices[0].message.content) {
      throw new LlmError(
        "invalid_response",
        "LLM provider returned no message content.",
      );
    }

    return parsed.data.choices[0].message.content;
  }

  return {
    chat: (messages: ChatMessage[], options?: CompletionOptions) =>
      complete(messages, options),
    vision: (
      messages: ChatMessage[],
      images: VisionImage[],
      options?: CompletionOptions,
    ) =>
      complete(
        messages,
        { ...options, model: options?.model ?? config.visionModel ?? config.model },
        images,
      ),
  };
}

export type LlmClient = ReturnType<typeof createLlmClient>;

let cachedClient: LlmClient | undefined;

/** Lazily built singleton used by route handlers. */
export function getLlmClient(): LlmClient {
  const env = getServerEnv();
  cachedClient ??= createLlmClient({
    baseUrl: env.LLM_BASE_URL,
    apiKey: env.LLM_API_KEY ?? "",
    model: env.LLM_MODEL,
    visionModel: env.LLM_VISION_MODEL,
    timeoutMs: env.LLM_TIMEOUT_MS,
    maxTokens: env.LLM_MAX_TOKENS,
  });
  return cachedClient;
}

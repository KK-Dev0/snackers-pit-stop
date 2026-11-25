import { describe, expect, it, vi } from "vitest";

import {
  createLlmClient,
  LlmError,
  type LlmClientConfig,
} from "@/server/llm/provider";

const baseConfig: LlmClientConfig = {
  baseUrl: "https://provider.example/v1/",
  apiKey: "server-only-key",
  model: "text-model",
  visionModel: "vision-model",
  timeoutMs: 5_000,
  maxTokens: 2_048,
};

const completion = (content: string) =>
  new Response(JSON.stringify({ choices: [{ message: { content } }] }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });

type FetchArgs = [input: RequestInfo | URL, init?: RequestInit];

function stubFetch(response: Response | (() => Response)) {
  return vi.fn(async (...args: FetchArgs) => {
    void args;
    return typeof response === "function" ? response() : response;
  });
}

describe("LLM provider wrapper", () => {
  it("posts an OpenAI-compatible chat request and returns the content", async () => {
    const fetchImpl = stubFetch(completion("hello"));
    const client = createLlmClient({ ...baseConfig, fetchImpl });

    await expect(
      client.chat([
        { role: "system", content: "be brief" },
        { role: "user", content: "hi" },
      ]),
    ).resolves.toBe("hello");

    const [url, init] = fetchImpl.mock.calls[0] as FetchArgs;
    expect(url).toBe("https://provider.example/v1/chat/completions");
    expect(init?.method).toBe("POST");
    expect(init?.headers).toMatchObject({
      "Content-Type": "application/json",
      Authorization: "Bearer server-only-key",
    });
    expect(JSON.parse(String(init?.body))).toMatchObject({
      model: "text-model",
      temperature: 0.2,
      max_tokens: 2_048,
      messages: [
        { role: "system", content: "be brief" },
        { role: "user", content: "hi" },
      ],
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
  });

  it("uses the vision model and inline image parts for vision calls", async () => {
    const fetchImpl = stubFetch(completion("recipe"));
    const client = createLlmClient({ ...baseConfig, fetchImpl });

    await client.vision(
      [{ role: "user", content: "What is this?" }],
      [{ kind: "data", mimeType: "image/jpeg", base64: "abc" }],
    );

    const body = JSON.parse(String((fetchImpl.mock.calls[0] as FetchArgs)[1]?.body));
    expect(body.model).toBe("vision-model");
    expect(body.messages[0].content).toEqual([
      { type: "text", text: "What is this?" },
      { type: "image_url", image_url: { url: "data:image/jpeg;base64,abc" } },
    ]);
  });

  it("fails with a configuration error when no key is set", async () => {
    const fetchImpl = stubFetch(completion("unused"));
    const client = createLlmClient({ ...baseConfig, apiKey: "", fetchImpl });

    await expect(client.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "configuration",
    } satisfies Partial<LlmError>);
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("maps provider HTTP failures to a typed error", async () => {
    const fetchImpl = stubFetch(new Response("nope", { status: 429 }));
    const client = createLlmClient({ ...baseConfig, fetchImpl });

    await expect(client.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "http",
      status: 429,
    } satisfies Partial<LlmError>);
  });

  it("maps malformed responses and timeouts to typed errors", async () => {
    const invalid = createLlmClient({
      ...baseConfig,
      fetchImpl: async () => new Response("not json", { status: 200 }),
    });
    await expect(invalid.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "invalid_response",
    } satisfies Partial<LlmError>);

    const timedOut = createLlmClient({
      ...baseConfig,
      fetchImpl: async () => {
        throw new DOMException("expired", "TimeoutError");
      },
    });
    await expect(timedOut.chat([{ role: "user", content: "hi" }])).rejects.toMatchObject({
      code: "timeout",
    } satisfies Partial<LlmError>);
  });
});

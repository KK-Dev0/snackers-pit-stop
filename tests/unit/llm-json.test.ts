import { describe, expect, it, vi } from "vitest";
import { z } from "zod";

import { generateJson, JsonGenerationError } from "@/server/llm/json";
import type {
  ChatMessage,
  CompletionOptions,
  LlmClient,
  VisionImage,
} from "@/server/llm/provider";

const schema = z.object({
  title: z.string().min(1),
  servings: z.number().int().min(1).default(2),
});

function fakeClient(responses: string[]) {
  const respond = () => responses.shift() ?? "";
  const chat = vi.fn(
    async (...args: [messages: ChatMessage[], options?: CompletionOptions]) => {
      void args;
      return respond();
    },
  );
  const vision = vi.fn(
    async (
      ...args: [
        messages: ChatMessage[],
        images: VisionImage[],
        options?: CompletionOptions,
      ]
    ) => {
      void args;
      return respond();
    },
  );
  return { client: { chat, vision } satisfies LlmClient, chat, vision };
}

const messages: ChatMessage[] = [{ role: "user", content: "Extract a recipe" }];

describe("generateJson", () => {
  it("returns Zod-parsed output on the first valid response", async () => {
    const { client, chat } = fakeClient([
      '```json\n{"title":"Poha"}\n```',
    ]);

    await expect(
      generateJson({ schema, messages, client }),
    ).resolves.toEqual({ title: "Poha", servings: 2 });
    expect(chat).toHaveBeenCalledTimes(1);
  });

  it("retries exactly once with the validation error and accepts the repair", async () => {
    const { client, chat } = fakeClient([
      '{"title":""}',
      '{"title":"Upma","servings":3}',
      '{"title":"Too late"}',
    ]);

    await expect(
      generateJson({ schema, messages, client }),
    ).resolves.toEqual({ title: "Upma", servings: 3 });

    expect(chat).toHaveBeenCalledTimes(2);
    const repairMessages = chat.mock.calls[1][0] as ChatMessage[];
    expect(repairMessages).toHaveLength(messages.length + 2);
    expect(repairMessages.at(-1)?.content).toContain("title");
  });

  it("throws a typed error after a single failed repair", async () => {
    const { client, chat } = fakeClient(["not json", "still not json"]);

    await expect(generateJson({ schema, messages, client })).rejects.toMatchObject({
      name: "JsonGenerationError",
      reason: "invalid_json",
    } satisfies Partial<JsonGenerationError>);
    expect(chat).toHaveBeenCalledTimes(2);
  });

  it("uses the vision path when images are supplied", async () => {
    const { client, chat, vision } = fakeClient(['{"title":"Dosa","servings":4}']);

    await generateJson({
      schema,
      messages,
      images: [{ kind: "data", mimeType: "image/png", base64: "abc" }],
      client,
    });

    expect(vision).toHaveBeenCalledTimes(1);
    expect(chat).not.toHaveBeenCalled();
  });
});

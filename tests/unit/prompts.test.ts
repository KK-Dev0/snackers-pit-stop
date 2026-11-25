import { describe, expect, it } from "vitest";

import {
  pageText,
  photoRecipeMessages,
  recipeExtractionMessages,
} from "@/server/llm/prompts";

describe("LLM extraction prompts", () => {
  it("requires strict JSON, forbids invented values and defines refusal", () => {
    const messages = recipeExtractionMessages({
      sourceUrl: "https://example.com/poha",
      pageText: "Poha recipe\nIngredients: 1 cup poha",
    });
    const system = messages[0].content;

    expect(system).toContain("ONLY a single JSON object");
    expect(system).toContain("Never invent nutrition");
    expect(system).toContain("no extra keys");
    expect(system).toContain('{"error":"not a recipe"}');
    expect(system).toContain("sourceUrl");
    expect(messages[1].content).toContain("https://example.com/poha");
    expect(messages[1].content).toContain("1 cup poha");
  });

  it("strips markup and truncates page text", () => {
    const html = `<style>.a{color:red}</style><script>bad()</script><h1>Poha</h1><p>1 cup &nbsp; poha</p>`;
    expect(pageText(html)).toBe("Poha 1 cup poha");
    expect(pageText("x".repeat(100), 10)).toHaveLength(10);
  });

  it("tells the vision model not to invent a source link", () => {
    const messages = photoRecipeMessages();
    expect(messages[1].content).toContain("image");
    expect(messages[0].content).toContain("Set sourceUrl to null");
    expect(messages[0].content).toContain("Read only what is visible");
  });
});

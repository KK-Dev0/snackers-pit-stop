import { NextRequest, NextResponse } from "next/server";

import { ImportUrlRequestSchema, RecipeDraftSchema } from "@/lib/schemas";
import { rateLimitRequest } from "@/server/rate-limit";
import {
  SafeFetchError,
  fetchPublicPage,
  type SafeFetchResult,
} from "@/server/import/safe-fetch";
import { parseRecipeJsonLd } from "@/server/import/jsonld";
import {
  failure,
  llmErrorCode,
  llmStatus,
  NO_STORE,
  safeFetchStatus,
} from "@/server/import/route-errors";
import { generateJson, JsonGenerationError } from "@/server/llm/json";
import { LlmError } from "@/server/llm/provider";
import { pageText, recipeExtractionMessages } from "@/server/llm/prompts";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return failure("Invalid JSON", "invalid_json", 400);
  }

  const parsed = ImportUrlRequestSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", issues: parsed.error.issues },
      { status: 400, headers: NO_STORE },
    );
  }

  const rl = rateLimitRequest(request, "import-url");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  }

  let page: SafeFetchResult;
  try {
    page = await fetchPublicPage(parsed.data.url);
  } catch (error) {
    if (error instanceof SafeFetchError) {
      return failure(error.message, error.code, safeFetchStatus(error));
    }
    return failure("Could not fetch that page.", "fetch_failed", 502);
  }

  // Structured data is authoritative: no model call when it is available.
  const fromJsonLd = parseRecipeJsonLd(page.html, page.url);
  if (fromJsonLd) {
    return NextResponse.json(
      { draft: fromJsonLd, method: "jsonld" },
      { headers: NO_STORE },
    );
  }

  try {
    const draft = await generateJson({
      schema: RecipeDraftSchema,
      messages: recipeExtractionMessages({
        sourceUrl: page.url,
        pageText: pageText(page.html),
      }),
    });
    const validated = RecipeDraftSchema.parse({ ...draft, sourceUrl: page.url });
    return NextResponse.json(
      { draft: validated, method: "llm" },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof LlmError || error instanceof JsonGenerationError) {
      return failure(error.message, llmErrorCode(error), llmStatus(error));
    }
    return failure("Could not extract a recipe from that page.", "extraction_failed", 422);
  }
}

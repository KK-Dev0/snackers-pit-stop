import { NextResponse } from "next/server";

import { JsonGenerationError } from "@/server/llm/json";
import { LlmError } from "@/server/llm/provider";
import type { SafeFetchError } from "./safe-fetch";

export const NO_STORE = { "Cache-Control": "no-store" };

export function failure(error: string, code: string, status: number) {
  return NextResponse.json({ error, code }, { status, headers: NO_STORE });
}

export function safeFetchStatus(error: SafeFetchError): number {
  switch (error.code) {
    case "invalid_url":
    case "blocked_host":
    case "content_type":
      return 400;
    case "too_large":
      return 413;
    case "timeout":
      return 504;
    case "dns":
    case "http":
    case "network":
      return 502;
  }
}

export function llmStatus(error: LlmError | JsonGenerationError): number {
  if (error instanceof LlmError) {
    if (error.code === "configuration") return 503;
    if (error.status === 429) return 429;
    if (error.code === "timeout") return 504;
  }
  return 422;
}

export function llmErrorCode(error: LlmError | JsonGenerationError): string {
  return error instanceof LlmError ? error.code : error.reason;
}

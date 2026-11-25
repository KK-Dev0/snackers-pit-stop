import { getServerEnv } from "@/lib/env";

import type { EmbeddingRanker, RetrievedRecipe } from "./types";

export function isEmbeddingsEnabled(): boolean {
  try {
    return Boolean(getServerEnv().EMBEDDINGS_ENABLED);
  } catch {
    return false;
  }
}

export function createEmbeddingRanker(enabled: boolean = isEmbeddingsEnabled()): EmbeddingRanker {
  return async (items: RetrievedRecipe[]) => {
    if (!enabled) return items;
    // Placeholder: no network calls while disabled; when enabled, a real
    // implementation would rerank here. Keep passthrough to avoid network.
    return items;
  };
}
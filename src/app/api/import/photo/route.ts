import { NextRequest, NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { RecipeDraftSchema } from "@/lib/schemas";
import { rateLimitRequest } from "@/server/rate-limit";
import { validateImage } from "@/server/import/image";
import {
  failure,
  llmErrorCode,
  llmStatus,
  NO_STORE,
} from "@/server/import/route-errors";
import { generateJson, JsonGenerationError } from "@/server/llm/json";
import { LlmError } from "@/server/llm/provider";
import { photoRecipeMessages } from "@/server/llm/prompts";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  if (!getServerEnv().PHOTO_IMPORT_ENABLED) {
    return failure("Photo import is disabled.", "feature_disabled", 404);
  }

  const rl = rateLimitRequest(request, "import-photo");
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { ...NO_STORE, "Retry-After": "60" } },
    );
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return failure("Expected a multipart image upload.", "invalid_form", 400);
  }

  const file = form.get("image");
  if (!(file instanceof File)) {
    return failure("Attach an image in the 'image' field.", "missing_image", 400);
  }

  const validation = validateImage({ type: file.type, size: file.size });
  if (!validation.ok) {
    return failure(validation.error, validation.code, validation.status);
  }

  const base64 = Buffer.from(await file.arrayBuffer()).toString("base64");
  try {
    const draft = await generateJson({
      schema: RecipeDraftSchema,
      messages: photoRecipeMessages(),
      images: [{ kind: "data", mimeType: file.type, base64 }],
    });
    const validated = RecipeDraftSchema.parse({ ...draft, sourceUrl: null });
    return NextResponse.json(
      { draft: validated, method: "photo" },
      { headers: NO_STORE },
    );
  } catch (error) {
    if (error instanceof LlmError || error instanceof JsonGenerationError) {
      return failure(error.message, llmErrorCode(error), llmStatus(error));
    }
    return failure("Could not read a recipe from that image.", "extraction_failed", 422);
  }
}

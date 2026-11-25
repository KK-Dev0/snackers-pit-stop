import type { ChatMessage } from "./provider";

/** Plain-text view of a page, kept small enough for a model's context. */
export function pageText(html: string, maxChars = 12_000): string {
  return html
    .replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[^>]*>[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/gi, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, maxChars);
}

const DRAFT_SHAPE = `{
  "title": "string (required)",
  "description": "one or two short sentences",
  "cuisine": "string",
  "diet": "vegan | veg | eggetarian | nonveg",
  "mealSlots": ["breakfast" | "lunch" | "snack" | "dinner"],
  "servings": "integer 1-20",
  "prepMin": "non-negative integer",
  "cookMin": "non-negative integer",
  "steps": ["string"],
  "sourceUrl": "string or null",
  "allergens": ["gluten | dairy | nuts | peanut | soy | egg | fish | shellfish | sesame"],
  "tags": ["string"],
  "ingredients": [
    {
      "rawName": "string as written in the source (required)",
      "quantity": "positive number",
      "unit": "g | kg | ml | l | tsp | tbsp | cup | piece",
      "optional": "boolean",
      "grams": "number or null"
    }
  ]
}`;

const STRICT_OUTPUT_RULES = `Return ONLY a single JSON object matching the shape below — no markdown fences, no commentary, no extra keys.
Never invent nutrition, calorie counts, prices, brands, or article text. Never translate a dish name. Keep ingredients as written in the source.
Use null or empty strings/arrays for fields you cannot determine instead of guessing. Use only the listed enum values and positive quantities.
Set sourceUrl to the URL supplied by the caller, verbatim. Allergen and diet values are best-effort hints for the user to review, not guarantees.`;

const REFUSAL_RULE = `If the input is not a recipe, or contains no readable ingredient list, return exactly {"error":"not a recipe"} and nothing else.`;

function systemPrompt(extra: string): string {
  return `${STRICT_OUTPUT_RULES}\n${extra}\n${REFUSAL_RULE}\n\nRequired JSON shape:\n${DRAFT_SHAPE}`;
}

/** Prompt for the URL import fallback when structured data is unavailable. */
export function recipeExtractionMessages(input: {
  sourceUrl: string;
  pageText: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: systemPrompt(
        "Extract one recipe from plain page text. Use only steps and ingredients present in that text; do not copy full article prose.",
      ),
    },
    {
      role: "user",
      content: `Source URL (copy it into sourceUrl): ${input.sourceUrl}\n\nPage text:\n${input.pageText}`,
    },
  ];
}

/** Prompt for the optional photo import path. */
export function photoRecipeMessages(): ChatMessage[] {
  return [
    {
      role: "system",
      content: systemPrompt(
        "Transcribe one recipe from the attached photo. Read only what is visible; leave unreadable fields empty. Set sourceUrl to null because an image has no source link.",
      ),
    },
    {
      role: "user",
      content: "Extract the recipe shown in this image into the requested JSON shape.",
    },
  ];
}

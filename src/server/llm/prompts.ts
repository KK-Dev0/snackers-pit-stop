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
  "description": "string",
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

const EXTRACTION_RULES = `You extract recipe structure only. Never invent nutrition, calorie counts, prices or article text. Never copy full article prose. Keep ingredient names as written and flag uncertain fields with null/empty values instead of guessing. If the text is not a recipe, return {"error":"not a recipe"}.`;

export function recipeExtractionMessages(input: {
  sourceUrl: string;
  pageText: string;
}): ChatMessage[] {
  return [
    {
      role: "system",
      content: `${EXTRACTION_RULES}\nReturn ONLY a JSON object with this exact shape:\n${DRAFT_SHAPE}`,
    },
    {
      role: "user",
      content: `Extract one recipe from the page text below. Set sourceUrl to ${input.sourceUrl}.\n\n${input.pageText}`,
    },
  ];
}

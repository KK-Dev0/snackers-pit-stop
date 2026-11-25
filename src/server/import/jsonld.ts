import {
  AllergenSchema,
  RecipeDraftSchema,
  type Allergen,
  type DietType,
  type RecipeDraft,
  type RecipeDraftIngredient,
  type Unit,
} from "@/lib/schemas";

type JsonRecord = Record<string, unknown>;

const JSONLD_SCRIPT = /<script\b[^>]*\btype\s*=\s*["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
const FRACTIONS: Record<string, number> = {
  "½": 0.5,
  "¼": 0.25,
  "¾": 0.75,
  "⅓": 1 / 3,
  "⅔": 2 / 3,
  "⅛": 0.125,
  "⅜": 0.375,
  "⅝": 0.625,
  "⅞": 0.875,
};
const UNIT_ALIASES: Array<[RegExp, Unit]> = [
  [/^tablespoons?\b|^tbsp\.?\b/i, "tbsp"],
  [/^teaspoons?\b|^tsp\.?\b/i, "tsp"],
  [/^kilograms?\b|^kgs?\.?\b/i, "kg"],
  [/^millilit(?:er|re)s?\b|^ml\.?\b/i, "ml"],
  [/^lit(?:er|re)s?\b|^l\.?\b/i, "l"],
  [/^cups?\b/i, "cup"],
  [/^grams?\b|^g\.?\b/i, "g"],
  [/^pieces?\b|^pcs?\.?\b/i, "piece"],
];

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function stringValue(value: unknown): string {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" && Number.isFinite(value)) return String(value);
  return "";
}

function stringList(value: unknown): string[] {
  if (typeof value === "string") {
    return value
      .split(/[,;]/)
      .map((part) => part.trim())
      .filter(Boolean);
  }
  if (Array.isArray(value)) {
    return value
      .map((item) => (isRecord(item) ? stringValue(item.name ?? item.text) : stringValue(item)))
      .filter(Boolean);
  }
  return [];
}

function decodeEntities(text: string): string {
  return text
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&quot;/gi, '"')
    .replace(/&#0*39;|&apos;/gi, "'")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">");
}

/** Flatten @graph/@type wrappers and look for schema.org Recipe nodes. */
export function findRecipeNodes(value: unknown, depth = 0): JsonRecord[] {
  if (depth > 6 || value === null || typeof value !== "object") return [];
  if (Array.isArray(value)) {
    return value.flatMap((item) => findRecipeNodes(item, depth + 1));
  }
  if (!isRecord(value)) return [];

  const types = stringList(value["@type"]);
  const recipes = types.some((type) => type.toLowerCase() === "recipe") ? [value] : [];
  const nested = Object.values(value).flatMap((item) => findRecipeNodes(item, depth + 1));
  return [...recipes, ...nested];
}

/** Parse an amount like "1 1/2", "¾" or "250" into a positive number. */
export function parseAmount(text: string): number | null {
  const mixed = /^\s*(\d+)\s+(\d+)\/(\d+)/.exec(text);
  if (mixed) {
    const amount = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    return Number.isFinite(amount) && Number(mixed[3]) !== 0 ? amount : null;
  }
  const fraction = /^\s*(\d+)\/(\d+)/.exec(text);
  if (fraction && Number(fraction[2]) !== 0) {
    return Number(fraction[1]) / Number(fraction[2]);
  }
  const symbol = /^\s*([½¼¾⅓⅔⅛⅜⅝⅞])/.exec(text);
  if (symbol) return FRACTIONS[symbol[1]] ?? null;
  const decimal = /^\s*(\d+(?:[.,]\d+)?)/.exec(text);
  if (decimal) {
    const amount = Number(decimal[1].replace(",", "."));
    return Number.isFinite(amount) && amount > 0 ? amount : null;
  }
  return null;
}

/** Turn a schema.org recipe ingredient line into a structured draft item. */
export function parseIngredientLine(line: string): RecipeDraftIngredient | null {
  const raw = stringValue(line);
  if (!raw) return null;

  const amount = parseAmount(raw);
  if (amount === null) {
    return {
      rawName: raw,
      quantity: 1,
      unit: "piece",
      optional: false,
    };
  }

  const remainder = raw
    .replace(/^\s*(?:\d+\s+\d+\/\d+|\d+\/\d+|[½¼¾⅓⅔⅛⅜⅝⅞]|\d+(?:[.,]\d+)?)/u, "")
    .trimStart();
  const unitMatch = UNIT_ALIASES.find(([pattern]) => pattern.test(remainder));
  const unit = unitMatch?.[1] ?? "piece";
  const afterUnit = unitMatch ? remainder.replace(unitMatch[0], "").trimStart() : remainder;
  const rawName = afterUnit.replace(/^\s*(?:of|in)\s+/i, "").trim();

  return {
    rawName: rawName || raw,
    quantity: amount,
    unit,
    optional: false,
  };
}

/** ISO 8601 durations used by schema.org (PT30M, PT1H30M, P1DT2H). */
export function parseDurationMinutes(value: unknown): number {
  const text = stringValue(value);
  const match = /^P(?:(\d+)D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/i.exec(text);
  if (!match) return 0;
  const [, days, hours, minutes] = match;
  return (
    Number(days ?? 0) * 1440 + Number(hours ?? 0) * 60 + Number(minutes ?? 0)
  );
}

function parseServings(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return Math.max(1, Math.round(value));
  const firstNumber = /(\d+(?:[.,]\d+)?)/.exec(stringValue(Array.isArray(value) ? value[0] : value));
  return firstNumber ? Math.max(1, Math.round(Number(firstNumber[1].replace(",", ".")))) : 2;
}

function instructionsFrom(value: unknown): string[] {
  const items = Array.isArray(value) ? value : value ? [value] : [];
  const steps: string[] = [];
  for (const item of items) {
    if (typeof item === "string") {
      if (item.trim()) steps.push(item.trim());
      continue;
    }
    if (!isRecord(item)) continue;
    const text = stringValue(item.text ?? item.name);
    if (text) steps.push(text);
    const nested = item.itemListElement ?? item.step;
    if (nested) steps.push(...instructionsFrom(nested));
  }
  return steps.filter((step, index) => step && steps.indexOf(step) === index);
}

function inferDiet(recipe: JsonRecord, ingredientNames: string[]): DietType {
  const diets = stringList(recipe.suitableForDiet ?? recipe.diet).map((value) =>
    value.split("/").pop()?.toLowerCase() ?? "",
  );
  if (diets.some((value) => value.includes("vegan"))) return "vegan";
  if (diets.some((value) => value.includes("vegetarian"))) return "veg";

  const text = ingredientNames.join(" ").toLowerCase();
  if (/\b(chicken|mutton|beef|pork|fish|prawn|meat|bacon)\b/.test(text)) return "nonveg";
  if (/\b(egg|eggs)\b/.test(text)) return "eggetarian";
  return "veg";
}

function allergensFrom(recipe: JsonRecord, ingredientNames: string[]): Allergen[] {
  const declared = stringList(recipe.allergens)
    .map((value) => value.toLowerCase())
    .filter((value): value is Allergen => AllergenSchema.safeParse(value).success);

  const text = ingredientNames.join(" ").toLowerCase();
  const hints: Array<[RegExp, Allergen]> = [
    [/\b(milk|curd|yogurt|ghee|butter|cheese|paneer)\b/, "dairy"],
    [/\b(wheat|atta|maida|bread|roti|pasta)\b/, "gluten"],
    [/\b(almond|cashew|walnut|nut)\b/, "nuts"],
    [/\b(peanut|groundnut)\b/, "peanut"],
    [/\b(soya|soy|tofu)\b/, "soy"],
    [/\b(egg|eggs)\b/, "egg"],
    [/\b(fish|prawn|shrimp)\b/, "fish"],
    [/\b(shellfish|crab)\b/, "shellfish"],
    [/\b(sesame|til)\b/, "sesame"],
  ];
  for (const [pattern, allergen] of hints) {
    if (pattern.test(text) && !declared.includes(allergen)) declared.push(allergen);
  }
  return declared;
}

function durationTotal(recipe: JsonRecord): number {
  const prep = parseDurationMinutes(recipe.prepTime);
  const cook = parseDurationMinutes(recipe.cookTime);
  const total = parseDurationMinutes(recipe.totalTime);
  return Math.max(prep + cook, total);
}

/**
 * Extract a schema.org Recipe from a page and map it to the reviewable draft
 * schema. Returns null when no usable Recipe is present.
 */
export function parseRecipeJsonLd(html: string, sourceUrl: string): RecipeDraft | null {
  const nodes: JsonRecord[] = [];
  for (const match of html.matchAll(JSONLD_SCRIPT)) {
    try {
      nodes.push(...findRecipeNodes(JSON.parse(decodeEntities(match[1]))));
    } catch {
      // Ignore malformed blocks; pages often contain broken JSON-LD.
    }
  }
  if (nodes.length === 0) return null;

  for (const recipe of nodes) {
    const title = stringValue(recipe.name ?? recipe.title ?? recipe.headline);
    const ingredientLines = stringList(recipe.recipeIngredient ?? recipe.ingredients);
    const ingredients: RecipeDraftIngredient[] = [];
    for (const line of ingredientLines) {
      const parsed = parseIngredientLine(line);
      if (parsed) ingredients.push(parsed);
    }

    if (!title || ingredients.length === 0) continue;

    const ingredientNames = ingredients.map((item) => item.rawName);
    const tags = stringList(recipe.keywords ?? recipe.recipeCategory ?? recipe.tags);
    const diet = inferDiet(recipe, ingredientNames);
    const draft = {
      title,
      description: stringValue(recipe.description),
      cuisine: stringValue(recipe.recipeCuisine),
      diet,
      mealSlots: ["lunch", "dinner"],
      servings: parseServings(recipe.recipeYield ?? recipe.servings),
      prepMin: parseDurationMinutes(recipe.prepTime),
      cookMin: parseDurationMinutes(recipe.cookTime ?? recipe.totalTime),
      steps: instructionsFrom(recipe.recipeInstructions ?? recipe.steps),
      sourceUrl,
      allergens: allergensFrom(recipe, ingredientNames),
      tags: tags.slice(0, 12),
      ingredients,
    };

    // Keep the duration total available as a fallback for cookMin.
    if (draft.cookMin === 0) {
      draft.cookMin = Math.max(0, durationTotal(recipe) - draft.prepMin);
    }

    const parsed = RecipeDraftSchema.safeParse(draft);
    if (parsed.success) return parsed.data;
  }

  return null;
}


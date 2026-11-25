import type { Ingredient } from "@/lib/schemas";

/** Normalize an ingredient label for tolerant, device-side catalog matching. */
export function normalizeIngredientName(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\b(?:fresh|dried|chopped|cut|raw|cooked|whole)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function singular(value: string): string {
  if (value.length > 3 && value.endsWith("ies")) return `${value.slice(0, -3)}y`;
  if (value.length > 3 && value.endsWith("es")) return value.slice(0, -2);
  if (value.length > 2 && value.endsWith("s")) return value.slice(0, -1);
  return value;
}

/**
 * Best-effort match of an imported free-text ingredient to a catalog item.
 * Exact and alias matches win; then singular/plural and token containment.
 * Returns null when nothing is confident enough to compute estimates.
 */
export function matchIngredientByName(
  name: string,
  ingredients: Ingredient[],
): Ingredient | null {
  const needle = normalizeIngredientName(name);
  if (!needle) return null;
  const needleSingular = singular(needle);

  const candidates = ingredients.map((ingredient) => ({
    ingredient,
    names: [ingredient.name, ...ingredient.aliases].map(normalizeIngredientName),
  }));

  for (const candidate of candidates) {
    if (candidate.names.some((value) => value === needle || singular(value) === needleSingular)) {
      return candidate.ingredient;
    }
  }

  for (const candidate of candidates) {
    if (
      candidate.names.some(
        (value) =>
          value.includes(needle) ||
          needle.includes(value) ||
          singular(value).includes(needleSingular),
      )
    ) {
      return candidate.ingredient;
    }
  }

  return null;
}

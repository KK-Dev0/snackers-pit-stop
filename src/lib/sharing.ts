import { groupByAisle } from "./shopping-list";
import type { ShoppingItem } from "./schemas";

/**
 * Plain text for WhatsApp or any share target: no markdown, no logos, grouped
 * by aisle, with the estimate disclaimer kept in the message.
 */
export function formatShoppingListText(
  items: ShoppingItem[],
  title = "Snackers Pit Stop shopping list",
  savedOrder: string[] = [],
): string {
  const groups = groupByAisle(items, savedOrder);
  const lines: string[] = [title, ""];

  for (const group of groups) {
    lines.push(group.label.toUpperCase());
    for (const item of group.items) {
      lines.push(`- ${item.name} ${item.quantity} ${item.unit}`.trim());
    }
    lines.push("");
  }

  const total = items.reduce((sum, item) => sum + (item.estimatedCostInr ?? 0), 0);
  if (total > 0) lines.push(`Approx total: ₹${total.toFixed(0)} (estimates only)`);
  lines.push("Prices and nutrition are estimates. Check labels for allergens.");
  return lines.join("\n").trim();
}

export type ShareResult = "shared" | "copied" | "cancelled" | "failed";

/** Prefer the Web Share API; fall back to the clipboard when unavailable. */
export async function shareText(
  text: string,
  title = "Shopping list",
): Promise<ShareResult> {
  if (typeof navigator === "undefined") return "failed";

  if (typeof navigator.share === "function") {
    try {
      await navigator.share({ title, text });
      return "shared";
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return "cancelled";
      // Fall through: a failed share should still offer a copy.
    }
  }

  try {
    await navigator.clipboard.writeText(text);
    return "copied";
  } catch {
    return "failed";
  }
}

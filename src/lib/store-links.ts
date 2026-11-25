import type { ShoppingItem, Store } from "./schemas";
import { groupByAisle } from "./shopping-list";

/** Turn a `{query}` store template into a safe search URL. */
export function buildStoreLink(
  template: string | null | undefined,
  query: string,
): string | null {
  if (!template) return null;
  const trimmed = query.trim();
  if (!trimmed || !template.includes("{query}")) return null;
  return template.replace("{query}", encodeURIComponent(trimmed));
}

/** A short search phrase for a whole list: the first few unique line names. */
export function listSearchQuery(
  items: ShoppingItem[],
  savedOrder: string[] = [],
  limit = 3,
): string {
  const ordered = groupByAisle(items, savedOrder).flatMap((group) => group.items);
  const names = [...new Set(ordered.map((item) => item.name.trim()).filter(Boolean))];
  return names.slice(0, Math.max(1, limit)).join(" ");
}

export type StoreLink = { store: Store; url: string };

/** Resolve every store that supports a search link for this query. */
export function storeLinksForQuery(stores: Store[], query: string): StoreLink[] {
  return stores.flatMap((store) => {
    const url = buildStoreLink(store.linkTemplate, query);
    return url ? [{ store, url }] : [];
  });
}

/** Plain-text fallback when a store has no search link or cannot be opened. */
export function handoffText(
  store: Store,
  items: ShoppingItem[],
  savedOrder: string[] = [],
): string {
  const groups = groupByAisle(items, savedOrder);
  const lines = [`${store.name} — shopping list`];
  for (const group of groups) {
    lines.push(`${group.label}:`);
    for (const item of group.items) {
      lines.push(`- ${item.name} ${item.quantity} ${item.unit}`.trim());
    }
  }
  return lines.join("\n");
}

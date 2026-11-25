import type { StoreWithAvailability } from "@/lib/schemas";

/** A device-local store choice. Absence means "not chosen yet". */
export type StoreChoice = {
  storeId: string;
  selected: boolean;
  customName?: string;
  confirmedByUser?: boolean;
};

export function displayStoreName(
  store: { id: string; name: string },
  choices: StoreChoice[] = [],
): string {
  const custom = choices.find((choice) => choice.storeId === store.id)?.customName;
  return custom?.trim() || store.name;
}

/** An explicit device choice always beats crowdsourced or profile data. */
export function isStoreSelected(
  storeId: string,
  choices: StoreChoice[] = [],
  profileStoreIds: string[] = [],
): boolean {
  const choice = choices.find((item) => item.storeId === storeId);
  if (choice) return choice.selected;
  return profileStoreIds.includes(storeId);
}

export type OrderedStore = StoreWithAvailability & {
  selected: boolean;
  displayName: string;
};

/** Selected stores first; unselected stores stay visible and in catalog order. */
export function orderStores(
  stores: StoreWithAvailability[],
  choices: StoreChoice[] = [],
  profileStoreIds: string[] = [],
): OrderedStore[] {
  return stores
    .map((store) => ({
      ...store,
      selected: isStoreSelected(store.id, choices, profileStoreIds),
      displayName: displayStoreName(store, choices),
    }))
    .sort(
      (a, b) =>
        Number(b.selected) - Number(a.selected) || a.sortOrder - b.sortOrder,
    );
}

/**
 * Handoff uses the user's picks when present. With no picks, every seeded
 * store is still offered (unconfirmed), so an unknown pincode never hides a
 * store.
 */
export function resolveHandoffStores(
  stores: StoreWithAvailability[],
  choices: StoreChoice[] = [],
  profileStoreIds: string[] = [],
): OrderedStore[] {
  const ordered = orderStores(stores, choices, profileStoreIds);
  const selected = ordered.filter((store) => store.selected);
  return selected.length > 0 ? selected : ordered;
}

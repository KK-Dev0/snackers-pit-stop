import Dexie, { type EntityTable } from "dexie";

import type { Profile, PantryItem, Plan, PlanMeal } from "@/lib/schemas";

export interface SavedRecipeRecord {
  id: string;
  slug?: string;
  recipe: unknown;
  sourceUrl?: string | null;
  sourceType: string;
  importedAt: number;
}

export interface PriceOverrideRecord {
  ingredientId: string;
  priceInr: number;
  priceBasis: string;
  updatedAt: number;
}

export interface ShoppingListStateRecord {
  planId: string;
  checkedKeys: string[];
  customItems: unknown[];
  removedKeys: string[];
  itemOrder: string[];
  includeStaples: boolean;
  updatedAt: number;
}

export interface UserStoreRecord {
  storeId: string;
  customName?: string;
  selected: boolean;
  confirmedByUser: boolean;
  updatedAt: number;
}

export interface SettingRecord {
  key: string;
  value: unknown;
}

export class SnackersDb extends Dexie {
  profile!: EntityTable<Profile, "id">;
  pantryItems!: EntityTable<PantryItem, "id">;
  plans!: EntityTable<Plan, "id">;
  planMeals!: EntityTable<PlanMeal, "id">;
  savedRecipes!: EntityTable<SavedRecipeRecord, "id">;
  priceOverrides!: EntityTable<PriceOverrideRecord, "ingredientId">;
  shoppingListState!: EntityTable<ShoppingListStateRecord, "planId">;
  userStores!: EntityTable<UserStoreRecord, "storeId">;
  settings!: EntityTable<SettingRecord, "key">;

  constructor() {
    super("snackers-pit-stop");
    this.version(1).stores({
      profile: "id",
      pantryItems: "id, normalizedName, ingredientId",
      plans: "id, weekStart",
      planMeals: "id, planId, [planId+dayIndex+slot], recipeId",
      savedRecipes: "id, importedAt",
      priceOverrides: "ingredientId",
      shoppingListState: "planId",
      userStores: "storeId",
      settings: "key",
    });
  }
}

let cached: SnackersDb | undefined;

export function getDb(): SnackersDb {
  if (typeof window === "undefined") {
    // SSR: return a dummy? Dexie requires IndexedDB. Guard.
    throw new Error("Dexie is client-only");
  }
  if (!cached) cached = new SnackersDb();
  return cached;
}

export const db =
  typeof window !== "undefined"
    ? new SnackersDb()
    : (null as unknown as SnackersDb);
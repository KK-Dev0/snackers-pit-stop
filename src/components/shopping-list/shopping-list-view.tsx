"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardListIcon, RefreshCwIcon, Share2Icon } from "lucide-react";

import type { ShoppingListStateRecord } from "@/client/db/dexie";
import { listSavedRecipes } from "@/client/db/repos/savedRecipes";
import { getShoppingListState, saveShoppingListState } from "@/client/db/repos/shoppingListState";
import { usePantry } from "@/client/hooks/use-pantry";
import { usePlans, usePlanMeals } from "@/client/hooks/use-plans";
import { useProfile } from "@/client/hooks/use-profile";
import { useUserStores } from "@/client/hooks/use-user-stores";
import { AisleSections } from "@/components/shopping-list/aisle-sections";
import { ShoppingListItem } from "@/components/shopping-list/shopping-list-item";
import { StoreHandoff } from "@/components/shopping-list/store-handoff";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { ShoppingListSkeleton } from "@/components/common/states";
import { PageReveal } from "@/components/motion/page-reveal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { generateShoppingList, subtractPantryFromList } from "@/lib/shopping-list";
import { formatShoppingListText, shareText } from "@/lib/sharing";
import { listSearchQuery } from "@/lib/store-links";
import { selectedStoresForHandoff } from "@/lib/store-selection";
import {
  IngredientListSchema,
  RecipeSchema,
  ShoppingItemSchema,
  StoresResponseSchema,
  type Ingredient,
  type PantryItem,
  type PlanMeal,
  type Recipe,
  type ShoppingItem,
  type ShoppingList,
  type StoreWithAvailability,
} from "@/lib/schemas";
import { formatWeekLabel, weekStartForDate } from "@/lib/weeks";

const EMPTY_STATE = (planId: string): ShoppingListStateRecord => ({
  planId,
  checkedKeys: [],
  customItems: [],
  removedKeys: [],
  itemOrder: [],
  includeStaples: false,
  updatedAt: 0,
});

type JsonShape = { items?: unknown };

function buildList(
  planId: string,
  meals: PlanMeal[],
  recipeMap: Map<string, Recipe>,
  ingredients: Ingredient[],
  pantry: PantryItem[],
  includeStaples: boolean,
): ShoppingList {
  const listMeals = meals.flatMap((meal) => {
    const recipe = recipeMap.get(meal.recipeId);
    if (!recipe) return [];
    return [
      {
        recipeId: meal.recipeId,
        servings: meal.servings,
        baseServings: recipe.servings,
        ingredients: (recipe.ingredients ?? []).map((item) => ({
          rawName: item.rawName,
          ingredientId: item.ingredientId,
          quantity: item.quantity,
          unit: item.unit,
        })),
      },
    ];
  });
  return subtractPantryFromList(generateShoppingList({ planId, meals: listMeals, ingredients }), {
    pantry,
    ingredients,
    includeStaples,
  });
}

/** Reads the active plan and computes the merged, pantry-adjusted list. */
export function ShoppingListView() {
  const plans = usePlans();
  const currentWeekStart = weekStartForDate(new Date());
  const activePlan =
    plans.find((plan) => plan.weekStart === currentWeekStart) ??
    [...plans].sort((a, b) => b.weekStart.localeCompare(a.weekStart))[0];
  const planId = activePlan?.id ?? null;
  const meals = usePlanMeals(planId);
  const pantry = usePantry();
  const profile = useProfile();
  const { records: userStoreRecords } = useUserStores();
  const pincode = profile?.pincode ?? null;

  const [catalog, setCatalog] = useState<Recipe[]>([]);
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [stores, setStores] = useState<StoreWithAvailability[]>([]);
  const [listState, setListState] = useState<ShoppingListStateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [localError, setLocalError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [shareMessage, setShareMessage] = useState("");

  useEffect(() => {
    let active = true;
    const storeUrl = pincode ? `/api/stores?pincode=${encodeURIComponent(pincode)}` : "/api/stores";
    void Promise.all([
      fetch("/api/recipes?limit=100").then((response) => response.json()),
      fetch("/api/ingredients").then((response) => response.json()),
      fetch(storeUrl).then((response) => response.json()),
    ])
      .then(([recipeJson, ingredientJson, storeJson]) => {
        const recipeData = RecipeSchema.array().safeParse((recipeJson as JsonShape).items ?? []);
        const ingredientData = IngredientListSchema.safeParse(
          (ingredientJson as JsonShape).items ?? [],
        );
        const storeData = StoresResponseSchema.safeParse(storeJson);
        if (!active) return;
        if (!recipeData.success || !ingredientData.success || !storeData.success) {
          throw new Error("Bad response");
        }
        setCatalog(recipeData.data);
        setIngredients(ingredientData.data);
        setStores(storeData.data.items);
        setError(false);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [retryCount, pincode]);

  useEffect(() => {
    let active = true;
    void listSavedRecipes()
      .then((records) =>
        records.flatMap((record) => {
          const parsed = RecipeSchema.safeParse(record.recipe);
          return parsed.success ? [parsed.data] : [];
        }),
      )
      .then((recipes) => {
        if (!active) return;
        setLocalRecipes(recipes);
        setLocalError(false);
      })
      .catch(() => active && setLocalError(true));
    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    if (!planId) return;
    let active = true;
    void getShoppingListState(planId)
      .then((record) => {
        if (active) {
          setListState(record ?? EMPTY_STATE(planId));
          setLocalError(false);
        }
      })
      .catch(() => active && setLocalError(true));
    return () => {
      active = false;
    };
  }, [planId, retryCount]);

  const includeStaples = listState?.includeStaples ?? false;

  // Device choices beat the profile; with no chooser every store is offered.
  const handoffStores = useMemo(
    () =>
      selectedStoresForHandoff(
        stores,
        userStoreRecords,
        profile?.storeIds ?? [],
        profile?.customStoreName,
      ),
    [stores, userStoreRecords, profile?.storeIds, profile?.customStoreName],
  );

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const recipe of catalog) map.set(recipe.id, recipe);
    for (const recipe of localRecipes) map.set(recipe.id, recipe);
    return map;
  }, [catalog, localRecipes]);

  // The React compiler memoizes this pure derivation; a manual useMemo around
  // the live Dexie `meals` array cannot be preserved safely.
  const generated = planId
    ? buildList(planId, meals, recipeMap, ingredients, pantry, includeStaples)
    : null;

  const customItems = useMemo(() => {
    const parsed = ShoppingItemSchema.array().safeParse(listState?.customItems ?? []);
    return parsed.success ? parsed.data : [];
  }, [listState?.customItems]);

  const items: ShoppingItem[] = useMemo(() => {
    if (!generated) return [];
    const removed = new Set(listState?.removedKeys ?? []);
    const checked = new Set(listState?.checkedKeys ?? []);
    return [...generated.items, ...customItems]
      .filter((item) => !removed.has(item.key))
      .map((item) => ({ ...item, checked: checked.has(item.key) }));
  }, [generated, customItems, listState?.removedKeys, listState?.checkedKeys]);

  const updateState = (patch: Partial<ShoppingListStateRecord>) => {
    if (!activePlan || !listState) return;
    const next = { ...listState, ...patch, updatedAt: Date.now() };
    setListState(next);
    void saveShoppingListState(next);
  };

  const { totalCost, checkedCount } = useMemo(
    () => ({
      totalCost: items.reduce((sum, item) => sum + (item.estimatedCostInr ?? 0), 0),
      checkedCount: items.filter((item) => item.checked).length,
    }),
    [items],
  );

  const headerQuery = useMemo(
    () => listSearchQuery(items, listState?.itemOrder),
    [items, listState?.itemOrder],
  );

  const share = async () => {
    const result = await shareText(
      formatShoppingListText(
        items,
        `Shopping list · ${formatWeekLabel(activePlan.weekStart)}`,
        listState?.itemOrder,
      ),
    );
    setShareMessage(
      result === "shared"
        ? "List shared."
        : result === "copied"
          ? "List copied — paste it into WhatsApp."
          : result === "cancelled"
            ? "Sharing cancelled."
            : "Could not copy the list. Please try again.",
    );
  };

  const toggleChecked = (key: string) => {
    const next = new Set(listState?.checkedKeys ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateState({ checkedKeys: [...next] });
  };

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      {!activePlan ? (
        <>
          <PageHeader
            eyebrow="One trip"
            title="Shopping list"
            description="Every ingredient in the week, merged, converted and grouped by aisle."
          />
          <EmptyState
            icon={ClipboardListIcon}
            title="No plan yet"
            description="Generate a weekly plan first and your merged shopping list will appear here."
            action={
              <Button asChild>
                <Link href="/plan">Go to planner</Link>
              </Button>
            }
          />
        </>
      ) : (
        <>
          <PageHeader
            eyebrow="One trip"
            title="Shopping list"
            description={`Week of ${formatWeekLabel(activePlan.weekStart)} · merged from your plan, minus the pantry.`}
          />

          {error || localError ? (
            <div role="alert">
              <EmptyState
                icon={RefreshCwIcon}
                title="Could not build the list"
                description="Some recipe or saved data is unavailable right now. Your list stays on this device — please try again."
                action={
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setRetryCount((count) => count + 1)}
                  >
                    Retry
                  </Button>
                }
              />
            </div>
          ) : loading || !listState || !generated ? (
            <ShoppingListSkeleton />
          ) : (
            <>
              <section aria-label="List summary" className="rounded-xl border bg-card p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-display text-xl font-semibold tabular-nums">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </p>
                    <p className="text-sm text-muted-foreground tabular-nums">
                      {checkedCount} checked · approx ₹{totalCost.toFixed(0)}
                    </p>
                    <p aria-live="polite" className="sr-only">
                      {checkedCount} of {items.length} items checked off.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StoreHandoff
                      stores={handoffStores}
                      query={headerQuery}
                      items={items}
                      savedOrder={listState?.itemOrder}
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      disabled={items.length === 0}
                      onClick={() => void share()}
                    >
                      <Share2Icon aria-hidden="true" /> Copy / share
                    </Button>
                    {checkedCount > 0 ? (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => updateState({ checkedKeys: [] })}
                      >
                        Reset checks
                      </Button>
                    ) : null}
                    <Checkbox
                      id="include-staples"
                      checked={listState.includeStaples}
                      onCheckedChange={(checked) =>
                        updateState({ includeStaples: checked === true })
                      }
                    />
                    <Label htmlFor="include-staples" className="font-normal">
                      Include staples
                    </Label>
                  </div>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">
                  Prices and nutrition are rough estimates. Check labels for allergens.
                </p>
                <p aria-live="polite" className="mt-1 text-xs text-muted-foreground">
                  {shareMessage}
                </p>
              </section>

              {items.length === 0 ? (
                <EmptyState
                  icon={ClipboardListIcon}
                  title="Nothing to shop for"
                  description="Your plan's ingredients are already covered by the pantry, or the week has no meals yet."
                  action={
                    <Button asChild variant="outline">
                      <Link href="/plan">Review the plan</Link>
                    </Button>
                  }
                />
              ) : (
                <AisleSections
                  items={items}
                  savedOrder={listState.itemOrder}
                  onMove={(next) => updateState({ itemOrder: next.map((item) => item.key) })}
                  renderItem={(item) => (
                    <div className="flex items-center gap-1">
                      <div className="min-w-0 flex-1">
                        <ShoppingListItem item={item} onToggle={toggleChecked} />
                      </div>
                      <StoreHandoff
                        stores={handoffStores}
                        query={item.name}
                        items={[item]}
                        savedOrder={[]}
                        label="Find at"
                        compact
                      />
                    </div>
                  )}
                />
              )}
            </>
          )}
        </>
      )}
    </PageReveal>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ClipboardListIcon, RefreshCwIcon } from "lucide-react";

import type { ShoppingListStateRecord } from "@/client/db/dexie";
import { listSavedRecipes } from "@/client/db/repos/savedRecipes";
import {
  getShoppingListState,
  saveShoppingListState,
} from "@/client/db/repos/shoppingListState";
import { usePantry } from "@/client/hooks/use-pantry";
import { usePlans, usePlanMeals } from "@/client/hooks/use-plans";
import { AisleSections } from "@/components/shopping-list/aisle-sections";
import { ShoppingListItem } from "@/components/shopping-list/shopping-list-item";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import {
  generateShoppingList,
  subtractPantryFromList,
} from "@/lib/shopping-list";
import {
  IngredientListSchema,
  RecipeSchema,
  ShoppingItemSchema,
  type Ingredient,
  type PantryItem,
  type PlanMeal,
  type Recipe,
  type ShoppingItem,
  type ShoppingList,
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
  return subtractPantryFromList(
    generateShoppingList({ planId, meals: listMeals, ingredients }),
    { pantry, ingredients, includeStaples },
  );
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

  const [catalog, setCatalog] = useState<Recipe[]>([]);
  const [localRecipes, setLocalRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [listState, setListState] = useState<ShoppingListStateRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    let active = true;
    void Promise.all([
      fetch("/api/recipes?limit=100").then((response) => response.json()),
      fetch("/api/ingredients").then((response) => response.json()),
    ])
      .then(([recipeJson, ingredientJson]) => {
        const recipeData = RecipeSchema.array().safeParse(
          (recipeJson as JsonShape).items ?? [],
        );
        const ingredientData = IngredientListSchema.safeParse(
          (ingredientJson as JsonShape).items ?? [],
        );
        if (!active) return;
        if (!recipeData.success || !ingredientData.success) throw new Error("Bad response");
        setCatalog(recipeData.data);
        setIngredients(ingredientData.data);
        setError(false);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [retryCount]);

  useEffect(() => {
    let active = true;
    void listSavedRecipes()
      .then((records) =>
        records.flatMap((record) => {
          const parsed = RecipeSchema.safeParse(record.recipe);
          return parsed.success ? [parsed.data] : [];
        }),
      )
      .then((recipes) => active && setLocalRecipes(recipes))
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!planId) return;
    let active = true;
    void getShoppingListState(planId)
      .then((record) => {
        if (active) {
          setListState(record ?? EMPTY_STATE(planId));
        }
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [planId]);

  const includeStaples = listState?.includeStaples ?? false;

  const recipeMap = useMemo(() => {
    const map = new Map<string, Recipe>();
    for (const recipe of catalog) map.set(recipe.id, recipe);
    for (const recipe of localRecipes) map.set(recipe.id, recipe);
    return map;
  }, [catalog, localRecipes]);

  const generated = planId
    ? buildList(planId, meals, recipeMap, ingredients, pantry, includeStaples)
    : null;

  const parsedCustom = ShoppingItemSchema.array().safeParse(listState?.customItems ?? []);
  const customItems = parsedCustom.success ? parsedCustom.data : [];

  const removed = new Set(listState?.removedKeys ?? []);
  const checked = new Set(listState?.checkedKeys ?? []);
  const items: ShoppingItem[] = generated
    ? [...generated.items, ...customItems]
        .filter((item) => !removed.has(item.key))
        .map((item) => ({ ...item, checked: checked.has(item.key) }))
    : [];

  const updateState = (patch: Partial<ShoppingListStateRecord>) => {
    if (!activePlan || !listState) return;
    const next = { ...listState, ...patch, updatedAt: Date.now() };
    setListState(next);
    void saveShoppingListState(next);
  };

  const totalCost = items.reduce((sum, item) => sum + (item.estimatedCostInr ?? 0), 0);
  const checkedCount = items.filter((item) => item.checked).length;

  const toggleChecked = (key: string) => {
    const next = new Set(listState?.checkedKeys ?? []);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateState({ checkedKeys: [...next] });
  };

  if (!activePlan) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
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
      </PageReveal>
    );
  }

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="One trip"
        title="Shopping list"
        description={`Week of ${formatWeekLabel(activePlan.weekStart)} · merged from your plan, minus the pantry.`}
      />

      {error ? (
        <EmptyState
          icon={RefreshCwIcon}
          title="Could not build the list"
          description="The recipe catalog is unavailable right now. Please try again."
          action={
            <Button type="button" variant="outline" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
            </Button>
          }
        />
      ) : loading || !listState || !generated ? (
        <div className="space-y-3">
          <Skeleton className="h-16 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
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
              <div className="flex items-center gap-2">
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
                <ShoppingListItem item={item} onToggle={toggleChecked} />
              )}
            />
          )}
        </>
      )}
    </PageReveal>
  );
}

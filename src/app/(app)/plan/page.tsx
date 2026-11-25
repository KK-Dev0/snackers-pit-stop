/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { CalendarDaysIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetClose,
} from "@/components/ui/sheet";
import { useProfile } from "@/client/hooks/use-profile";
import { usePlans, usePlanMeals } from "@/client/hooks/use-plans";
import { getDb } from "@/client/db/dexie";
import { generatePlan, eligibleRecipes } from "@/lib/planner";
import type { Ingredient, Recipe } from "@/lib/schemas";
import { FuelGauge } from "@/components/common/fuel-gauge";
import { recipeNutrition } from "@/lib/nutrition";
import { recipeCost } from "@/lib/cost";

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanPage() {
  const profile = useProfile();
  const plans = usePlans();
  const activePlanId = plans[0]?.id ?? null;
  const meals = usePlanMeals(activePlanId);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; slot: string } | null>(null);

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes?limit=100").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
    ])
      .then(([recipeData, ingredientData]) => {
        setRecipes(recipeData.items ?? []);
        setIngredients(ingredientData.items ?? []);
      })
      .catch(() => undefined);
  }, []);

  const ingMap = new Map(ingredients.map((i) => [i.id, i]));

  const mealStats = (recipeId: string, mealServings: number) => {
    const recipe = recipes.find((r) => r.id === recipeId);
    if (!recipe) return { kcal: 0, cost: 0 };
    const items = (recipe.ingredients ?? []).map((ri: any) => ({
      ingredient: ri.ingredientId ? ingMap.get(ri.ingredientId) ?? null : null,
      quantity: ri.quantity,
      unit: ri.unit,
    }));
    const nut = recipeNutrition(items, recipe.servings);
    const cost = recipeCost(items, recipe.servings);
    return {
      kcal: Math.round(nut.kcal * mealServings),
      cost: Math.round(cost.perServing * mealServings * 100) / 100,
    };
  };

  const dayStats = (dayIndex: number) => {
    const dayMeals = meals.filter((m) => m.dayIndex === dayIndex);
    return dayMeals.reduce(
      (acc, m) => {
        const s = mealStats(m.recipeId, m.servings);
        return { kcal: acc.kcal + s.kcal, cost: acc.cost + s.cost };
      },
      { kcal: 0, cost: 0 },
    );
  };

  const weeklyCost = meals.reduce((acc, m) => {
    const s = mealStats(m.recipeId, m.servings);
    return acc + s.cost;
  }, 0);

  const generate = async () => {
    if (!profile) return;
    setLoading(true);
    try {
      const weekStart = new Date().toISOString().slice(0, 10);
      const res = await fetch(`/api/recipes?limit=100&diet=${profile.diet}`);
      const data = await res.json();
      const recipes = (data.items ?? []) as Recipe[];
      const { plan, meals: generated } = generatePlan({
        recipes,
        diet: profile.diet,
        allergens: [...profile.allergens],
        dislikes: [...profile.dislikes],
        servings: profile.servings,
        seed: weekStart,
        weekStart,
      });
      const db = getDb();
      await db.plans.put(plan);
      await db.planMeals.where("planId").equals(plan.id).delete();
      await db.planMeals.bulkPut(generated);
    } finally {
      setLoading(false);
    }
  };

  const replaceMeal = async (recipeId: string) => {
    if (!swapTarget || !activePlanId) return;
    const meal = meals.find(
      (m) => m.dayIndex === swapTarget.dayIndex && m.slot === swapTarget.slot,
    );
    if (!meal) return;
    const db = getDb();
    await db.planMeals.put({ ...meal, recipeId });
    setSwapTarget(null);
  };

  const alternatives = swapTarget
    ? eligibleRecipes(
        recipes,
        swapTarget.slot,
        profile?.diet,
        [...(profile?.allergens ?? [])],
        [...(profile?.dislikes ?? [])],
      ).slice(0, 8)
    : [];

  if (profile === undefined || plans === undefined) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </PageReveal>
    );
  }

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="This week"
        title="Your week, sorted"
        description="Breakfast, lunch, snack and dinner for seven days — built around your diet, calories and budget."
      />
      <div className="flex justify-end">
        <Button onClick={generate} disabled={loading || !profile}>
          {loading ? "Generating…" : "Generate plan"}
        </Button>
      </div>

      {profile && meals.length > 0 && (
        <div className="rounded-lg border bg-card p-4">
          <h2 className="font-semibold">Weekly budget</h2>
          <FuelGauge
            value={weeklyCost}
            max={profile.weeklyBudgetInr}
            label="Weekly budget used"
            className="mx-auto max-w-xs"
          />
          <p className="text-center text-sm text-muted-foreground">
            ₹{weeklyCost.toFixed(0)} of ₹{profile.weeklyBudgetInr} · {profile.calorieGoal} kcal/day goal
          </p>
        </div>
      )}

      {meals.length === 0 ? (
        <EmptyState
          icon={CalendarDaysIcon}
          title="No plan yet"
          description="Finish onboarding and generate a week of meals in one tap. Swaps and locks arrive with the planner."
        />
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
          {DAYS.map((day, dayIndex) => (
            <div key={day} className="rounded-lg border bg-card p-3">
              <h2 className="font-semibold">{day}</h2>
              <p className="text-xs text-muted-foreground">
                {dayStats(dayIndex).kcal} kcal · ₹{dayStats(dayIndex).cost.toFixed(0)}
              </p>
              <div className="mt-2 space-y-2">
                {SLOTS.map((slot) => {
                  const meal = meals.find(
                    (m) => m.dayIndex === dayIndex && m.slot === slot,
                  );
                  return (
                    <div key={slot} className="rounded-md bg-muted p-2 text-sm">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-muted-foreground">{slot}</span>
                        {meal && (
                          <button
                            type="button"
                            className="text-xs text-primary underline"
                            onClick={() => setSwapTarget({ dayIndex, slot })}
                          >
                            Swap
                          </button>
                        )}
                      </div>
                      <p className="truncate">{meal ? meal.recipeId : "—"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <Sheet open={!!swapTarget} onOpenChange={(open) => !open && setSwapTarget(null)}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Swap meal</SheetTitle>
            <SheetDescription>
              Choose an alternative {swapTarget?.slot} from your ranked recipes.
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 space-y-2">
            {alternatives.map((r) => {
              const preview = mealStats(r.id, 1);
              return (
                <SheetClose asChild key={r.id}>
                  <button
                    type="button"
                    onClick={() => replaceMeal(r.id)}
                    className="w-full rounded-md border p-3 text-left hover:bg-muted"
                  >
                    <p className="font-medium">{r.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {preview.kcal} kcal · ₹{preview.cost.toFixed(0)}
                    </p>
                  </button>
                </SheetClose>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </PageReveal>
  );
}
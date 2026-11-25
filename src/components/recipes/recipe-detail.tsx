"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeftIcon, CalendarPlusIcon, ExternalLinkIcon } from "lucide-react";

import {
  getPlanByWeekStart,
  listPlanMeals,
  savePlan,
  savePlanMeal,
} from "@/client/db/repos/plans";
import { PageReveal } from "@/components/motion/page-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { recipeCost } from "@/lib/cost";
import { recipeNutrition } from "@/lib/nutrition";
import {
  type Ingredient,
  type MealSlot,
  type Plan,
  type Recipe,
} from "@/lib/schemas";
import { weekStartForDate } from "@/lib/weeks";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Catalog recipe detail with live scaling, estimates and add-to-plan. */
export function RecipeDetail({
  recipe,
  ingredients,
}: {
  recipe: Recipe;
  ingredients: Ingredient[];
}) {
  const [servings, setServings] = useState(recipe.servings);
  const [slot, setSlot] = useState<MealSlot>(recipe.mealSlots[0] ?? "dinner");
  const [dayIndex, setDayIndex] = useState(0);
  const [status, setStatus] = useState<{ text: string; error: boolean } | null>(null);
  const [adding, setAdding] = useState(false);

  const resolved = useMemo(() => {
    const byId = new Map(ingredients.map((ingredient) => [ingredient.id, ingredient]));
    return (recipe.ingredients ?? []).map((item) => ({
      rawName: item.rawName,
      quantity: item.quantity,
      unit: item.unit,
      ingredient: item.ingredientId ? byId.get(item.ingredientId) ?? null : null,
    }));
  }, [recipe, ingredients]);

  const scale = servings / recipe.servings;
  const scaledItems = useMemo(
    () => resolved.map((item) => ({ ...item, quantity: item.quantity * scale })),
    [resolved, scale],
  );
  const nutrition = useMemo(() => recipeNutrition(scaledItems, servings), [scaledItems, servings]);
  const cost = useMemo(() => recipeCost(scaledItems, servings), [scaledItems, servings]);
  const matchedCount = resolved.filter((item) => item.ingredient).length;

  const addToPlan = async () => {
    setAdding(true);
    setStatus(null);
    try {
      const weekStart = weekStartForDate(new Date());
      let plan = await getPlanByWeekStart(weekStart);
      if (!plan) {
        const now = Date.now();
        const created: Plan = {
          id: crypto.randomUUID(),
          weekStart,
          createdAt: now,
          updatedAt: now,
        };
        await savePlan(created);
        plan = created;
      }

      const meals = await listPlanMeals(plan.id);
      const occupied = meals.filter(
        (meal) => meal.dayIndex === dayIndex && meal.slot === slot,
      ).length;

      await savePlanMeal({
        id: crypto.randomUUID(),
        planId: plan.id,
        dayIndex,
        slot,
        recipeId: recipe.id,
        recipeSource: "catalog",
        servings,
        locked: false,
        sortOrder: occupied,
      });
      setStatus({ text: `Added to ${DAYS[dayIndex]} ${slot}.`, error: false });
    } catch {
      setStatus({ text: "Could not add this recipe to your plan.", error: true });
    } finally {
      setAdding(false);
    }
  };

  return (
    <PageReveal className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 sm:px-6">
      <Button asChild variant="ghost" size="sm" className="-ml-2">
        <Link href="/recipes">
          <ArrowLeftIcon aria-hidden="true" /> Back to recipes
        </Link>
      </Button>

      <header className="space-y-3">
        <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
          Recipe · {recipe.cuisine || "Home cooking"}
        </p>
        <h1 className="font-display text-3xl font-semibold">{recipe.title}</h1>
        {recipe.description ? (
          <p className="text-muted-foreground">{recipe.description}</p>
        ) : null}
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="capitalize">
            {recipe.diet}
          </Badge>
          {recipe.mealSlots.map((mealSlot) => (
            <Badge key={mealSlot} variant="outline" className="capitalize">
              {mealSlot}
            </Badge>
          ))}
          {recipe.allergens.map((allergen) => (
            <Badge key={allergen} variant="destructive" className="capitalize">
              {allergen}
            </Badge>
          ))}
        </div>
      </header>

      <section aria-label="Servings" className="flex flex-wrap items-center gap-3 rounded-xl border bg-card p-4">
        <span className="text-sm font-medium">Servings</span>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Decrease servings"
            disabled={servings <= 1}
            onClick={() => setServings((value) => Math.max(1, value - 1))}
          >
            −
          </Button>
          <span className="w-8 text-center font-semibold tabular-nums">{servings}</span>
          <Button
            type="button"
            variant="outline"
            size="icon"
            aria-label="Increase servings"
            disabled={servings >= 20}
            onClick={() => setServings((value) => Math.min(20, value + 1))}
          >
            +
          </Button>
        </div>
        <span className="ml-auto text-xs text-muted-foreground">
          Estimates update with servings
        </span>
      </section>

      <section aria-label="Estimates" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Energy</p>
          <p className="font-display text-xl font-semibold">{nutrition.kcal} kcal</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Protein</p>
          <p className="font-display text-xl font-semibold">{nutrition.proteinG} g</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Cost / serving</p>
          <p className="font-display text-xl font-semibold">₹{cost.perServing}</p>
        </div>
        <div className="rounded-xl border bg-card p-3">
          <p className="text-xs text-muted-foreground">Total time</p>
          <p className="font-display text-xl font-semibold">{recipe.prepMin + recipe.cookMin} min</p>
        </div>
      </section>
      {matchedCount < resolved.length ? (
        <p className="text-xs text-muted-foreground">
          Estimates cover {matchedCount} of {resolved.length} ingredients. Always check labels.
        </p>
      ) : null}

      <section aria-labelledby="ingredients-heading" className="space-y-2">
        <h2 id="ingredients-heading" className="font-display text-xl font-semibold">
          Ingredients
        </h2>
        <ul className="divide-y rounded-xl border bg-card">
          {resolved.map((item, index) => (
            <li
              key={`${item.rawName}-${index}`}
              className="flex items-center justify-between px-4 py-2.5 text-sm"
            >
              <span>
                {item.rawName}
                {!item.ingredient ? (
                  <span className="ml-2 text-xs text-muted-foreground">unmatched</span>
                ) : null}
              </span>
              <span className="text-muted-foreground tabular-nums">
                {(item.quantity * scale).toLocaleString(undefined, {
                  maximumFractionDigits: 2,
                })}{" "}
                {item.unit}
              </span>
            </li>
          ))}
        </ul>
      </section>

      {recipe.steps.length > 0 ? (
        <section aria-labelledby="steps-heading" className="space-y-2">
          <h2 id="steps-heading" className="font-display text-xl font-semibold">
            Method
          </h2>
          <ol className="list-decimal space-y-2 pl-5">
            {recipe.steps.map((step, index) => (
              <li key={index} className="text-sm leading-relaxed">
                {step}
              </li>
            ))}
          </ol>
        </section>
      ) : null}

      <section aria-labelledby="add-plan-heading" className="space-y-3 rounded-2xl border bg-card p-5">
        <h2 id="add-plan-heading" className="font-display text-lg font-semibold">
          Add to this week&apos;s plan
        </h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <label htmlFor="plan-day" className="text-sm font-medium">
              Day
            </label>
            <Select value={String(dayIndex)} onValueChange={(value) => setDayIndex(Number(value))}>
              <SelectTrigger id="plan-day" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DAYS.map((day, index) => (
                  <SelectItem key={day} value={String(index)}>
                    {day}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <label htmlFor="plan-slot" className="text-sm font-medium">
              Meal
            </label>
            <Select value={slot} onValueChange={(value) => setSlot(value as MealSlot)}>
              <SelectTrigger id="plan-slot" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {recipe.mealSlots.map((mealSlot) => (
                  <SelectItem key={mealSlot} value={mealSlot} className="capitalize">
                    {mealSlot}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button type="button" onClick={() => void addToPlan()} disabled={adding}>
            <CalendarPlusIcon aria-hidden="true" />
            {adding ? "Adding…" : "Add to plan"}
          </Button>
        </div>
        {status ? (
          <p role={status.error ? "alert" : "status"} className={`text-sm ${status.error ? "text-destructive" : "text-muted-foreground"}`}>
            {status.text}
          </p>
        ) : null}
      </section>

      {recipe.sourceUrl ? (
        <a
          href={recipe.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
        >
          View original source <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
        </a>
      ) : null}
    </PageReveal>
  );
}

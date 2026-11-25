/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  CalendarDaysIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  GripVerticalIcon,
} from "lucide-react";

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
import type { Ingredient, MealSlot, Plan, Recipe } from "@/lib/schemas";
import { addDays, formatWeekLabel, weekStartForDate } from "@/lib/weeks";
import { FuelGauge } from "@/components/common/fuel-gauge";
import { recipeNutrition } from "@/lib/nutrition";
import { recipeCost } from "@/lib/cost";

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** The drag activator is its own button so lock/swap stay independent tab stops. */
function DraggableMeal({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id,
    data: { label },
  });
  return (
    <div
      ref={setNodeRef}
      style={{ opacity: isDragging ? 0.5 : 1 }}
      className="flex items-start gap-1"
    >
      <button
        type="button"
        {...listeners}
        {...attributes}
        aria-label={`Move ${label}`}
        className="mt-0.5 rounded p-0.5 text-muted-foreground hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring"
      >
        <GripVerticalIcon className="size-3.5" aria-hidden="true" />
      </button>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function slotTargetLabel(id: string | number | undefined): string {
  const [dayIndex, slot] = String(id ?? "").split(":");
  const day = DAYS[Number(dayIndex)];
  return day && slot ? `${day} ${slot}` : "another slot";
}

function draggedMealLabel(id: string | number | undefined): string {
  return String(id ?? "") || "meal";
}

function DroppableSlot({
  id,
  label,
  children,
}: {
  id: string;
  label: string;
  children: ReactNode;
}) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      role="group"
      aria-label={`${label} slot`}
      className={isOver ? "rounded-md ring-2 ring-primary" : undefined}
    >
      {children}
    </div>
  );
}

export default function PlanPage() {
  const profile = useProfile();
  const plans = usePlans();
  const currentWeekStart = weekStartForDate(new Date());
  const [selectedWeekStart, setSelectedWeekStart] = useState(currentWeekStart);
  const activePlan = plans.find((p) => p.weekStart === selectedWeekStart);
  const activePlanId = activePlan?.id ?? null;
  const previousPlan = plans.find(
    (p) => p.weekStart === addDays(selectedWeekStart, -7),
  );
  const meals = usePlanMeals(activePlanId);
  const [loading, setLoading] = useState(false);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [swapTarget, setSwapTarget] = useState<{ dayIndex: number; slot: string } | null>(null);
  const [status, setStatus] = useState("");
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor),
  );

  useEffect(() => {
    Promise.all([
      fetch("/api/recipes?limit=100").then((r) => r.json()),
      fetch("/api/ingredients").then((r) => r.json()),
    ])
      .then(([recipeData, ingredientData]) => {
        setRecipes(recipeData.items ?? []);
        setIngredients(ingredientData.items ?? []);
      })
      .catch(() => setStatus("Could not load recipe details. Plan estimates may be incomplete."));
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
      const weekStart = selectedWeekStart;
      const res = await fetch(`/api/recipes?limit=100&diet=${profile.diet}`);
      if (!res.ok) throw new Error("Recipe catalog unavailable");
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
      setStatus(`Generated a plan for the week of ${formatWeekLabel(weekStart)}.`);
    } catch {
      setStatus("Could not generate the plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyLastWeek = async () => {
    if (!previousPlan) return;
    setLoading(true);
    try {
      const db = getDb();
      const previousMeals = await db.planMeals
        .where("planId")
        .equals(previousPlan.id)
        .toArray();
      const now = Date.now();
      const plan: Plan = {
        id: `plan-${selectedWeekStart}`,
        weekStart: selectedWeekStart,
        createdAt: now,
        updatedAt: now,
      };
      const copied = previousMeals.map((meal, index) => {
        const suffix = meal.id.startsWith(previousPlan.id)
          ? meal.id.slice(previousPlan.id.length)
          : `-${index}`;
        return { ...meal, id: `${plan.id}${suffix}`, planId: plan.id };
      });
      await db.plans.put(plan);
      await db.planMeals.where("planId").equals(plan.id).delete();
      await db.planMeals.bulkPut(copied);
      setStatus(`Copied ${copied.length} meals from last week.`);
    } catch {
      setStatus("Could not copy last week's plan. Please try again.");
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
    try {
      await db.planMeals.put({ ...meal, recipeId });
      const replacement = recipes.find((recipe) => recipe.id === recipeId);
      setStatus(
        `Replaced ${DAYS[swapTarget.dayIndex]} ${swapTarget.slot} with ${replacement?.title ?? recipeId}.`,
      );
      setSwapTarget(null);
    } catch {
      setStatus("Could not swap that meal. Please try again.");
    }
  };

  const toggleLock = async (mealId: string) => {
    const meal = meals.find((m) => m.id === mealId);
    if (!meal) return;
    const db = getDb();
    try {
      await db.planMeals.put({ ...meal, locked: !meal.locked });
      setStatus(
        `${DAYS[meal.dayIndex]} ${meal.slot} ${meal.locked ? "unlocked" : "locked"}.`,
      );
    } catch {
      setStatus("Could not update that meal's lock. Please try again.");
    }
  };

  const regenerate = async () => {
    if (!profile || !activePlanId) return;
    setLoading(true);
    try {
      const plan = plans.find((p) => p.id === activePlanId);
      const locks = meals
        .filter((m) => m.locked)
        .map((m) => ({
          dayIndex: m.dayIndex,
          slot: m.slot,
          recipeId: m.recipeId,
          recipeSource: m.recipeSource,
          servings: m.servings,
        }));
      const { plan: newPlan, meals: generated } = generatePlan({
        recipes,
        diet: profile.diet,
        allergens: [...profile.allergens],
        dislikes: [...profile.dislikes],
        servings: profile.servings,
        seed: `${plan?.weekStart ?? "week"}-${Date.now()}`,
        weekStart: plan?.weekStart ?? new Date().toISOString().slice(0, 10),
        locks,
      });
      const db = getDb();
      await db.planMeals.where("planId").equals(newPlan.id).delete();
      await db.planMeals.bulkPut(generated);
      setStatus(`Regenerated ${generated.length} meals; locked meals were kept.`);
    } catch {
      setStatus("Could not regenerate the plan. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const meal = meals.find((m) => m.id === active.id);
    if (!meal) return;
    const [dayStr, slotRaw] = String(over.id).split(":");
    const slot = slotRaw as MealSlot;
    const dayIndex = Number(dayStr);
    if (!Number.isInteger(dayIndex) || !SLOTS.includes(slot as any)) return;
    const target = meals.find(
      (m) => m.dayIndex === dayIndex && m.slot === slot && m.id !== meal.id,
    );
    const db = getDb();
    try {
      if (target) {
        await db.planMeals.put({ ...meal, dayIndex, slot });
        await db.planMeals.put({
          ...target,
          dayIndex: meal.dayIndex,
          slot: meal.slot,
        });
        setStatus(`Swapped meals with ${slotTargetLabel(String(over.id))}.`);
      } else {
        await db.planMeals.put({ ...meal, dayIndex, slot });
        setStatus(`Moved meal to ${slotTargetLabel(String(over.id))}.`);
      }
    } catch {
      setStatus("Could not move that meal. Please try again.");
    }
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
        eyebrow="Planner"
        title="Your week, sorted"
        description="Breakfast, lunch, snack and dinner for seven days — built around your diet, calories and budget."
      />
      <p role="status" aria-live="polite" className="sr-only">
        {status}
      </p>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            aria-label="Previous week"
            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, -7))}
          >
            <ChevronLeftIcon />
          </Button>
          <span aria-live="polite" className="min-w-28 text-center text-sm font-medium">
            Week of {formatWeekLabel(selectedWeekStart)}
          </span>
          <Button
            variant="outline"
            size="icon"
            aria-label="Next week"
            onClick={() => setSelectedWeekStart(addDays(selectedWeekStart, 7))}
          >
            <ChevronRightIcon />
          </Button>
          {selectedWeekStart !== currentWeekStart && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSelectedWeekStart(currentWeekStart)}
            >
              This week
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={copyLastWeek}
            disabled={loading || !previousPlan || !!activePlan}
          >
            Copy last week
          </Button>
          <Button
            variant="outline"
            onClick={regenerate}
            disabled={loading || !profile || meals.length === 0}
          >
            Regenerate
          </Button>
          <Button onClick={generate} disabled={loading || !profile}>
            {loading ? "Generating…" : "Generate plan"}
          </Button>
        </div>
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
          description="Generate a plan for this week, or copy last week's meals and start from there."
        />
      ) : (
        <DndContext
          sensors={sensors}
          onDragEnd={handleDragEnd}
          accessibility={{
            screenReaderInstructions: {
              draggable:
                "Press Enter or Space on a meal's Move button, use the arrow keys to choose a day and slot, then press Space to drop. Press Escape to cancel.",
            },
            announcements: {
              onDragStart: ({ active }) =>
                `Picked up ${String(active.data.current?.label ?? draggedMealLabel(active.id))}.`,
              onDragOver: ({ over }) =>
                over ? `Over ${slotTargetLabel(over.id)}.` : "No drop target.",
              onDragEnd: ({ active, over }) =>
                over
                  ? `Dropped ${String(active.data.current?.label ?? draggedMealLabel(active.id))} on ${slotTargetLabel(over.id)}.`
                  : "Move cancelled.",
              onDragCancel: () => "Move cancelled.",
            },
          }}
        >
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
                    const slotLabel = `${day} ${slot}`;
                    const recipeTitle =
                      recipes.find((recipe) => recipe.id === meal?.recipeId)?.title ??
                      meal?.recipeId;
                    return (
                      <DroppableSlot
                        key={slot}
                        id={`${dayIndex}:${slot}`}
                        label={slotLabel}
                      >
                        {meal ? (
                          <DraggableMeal id={meal.id} label={slotLabel}>
                            <div className="rounded-md bg-muted p-2 text-sm">
                              <div className="flex items-center justify-between gap-2">
                                <span className="text-muted-foreground">{slot}</span>
                                <span className="flex gap-2">
                                  <button
                                    type="button"
                                    aria-label={`${meal.locked ? "Unlock" : "Lock"} ${slotLabel}: ${recipeTitle}`}
                                    className="text-xs text-foreground underline decoration-primary underline-offset-2"
                                    onClick={() => toggleLock(meal.id)}
                                  >
                                    {meal.locked ? "Unlock" : "Lock"}
                                  </button>
                                  <button
                                    type="button"
                                    aria-label={`Swap ${slotLabel}: ${recipeTitle}`}
                                    className="text-xs text-foreground underline decoration-primary underline-offset-2"
                                    onClick={() => setSwapTarget({ dayIndex, slot })}
                                  >
                                    Swap
                                  </button>
                                </span>
                              </div>
                              <p className="truncate">{recipeTitle ?? "—"}</p>
                            </div>
                          </DraggableMeal>
                        ) : (
                          <div className="rounded-md border border-dashed bg-muted/50 p-2 text-sm text-muted-foreground">
                            <span className="sr-only">{slotLabel}: </span>No meal — drop here
                          </div>
                        )}
                      </DroppableSlot>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </DndContext>
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
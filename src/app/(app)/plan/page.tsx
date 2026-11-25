"use client";

import { useState } from "react";
import { CalendarDaysIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile } from "@/client/hooks/use-profile";
import { usePlans, usePlanMeals } from "@/client/hooks/use-plans";
import { getDb } from "@/client/db/dexie";
import { generatePlan } from "@/lib/planner";
import type { Recipe } from "@/lib/schemas";

const SLOTS = ["breakfast", "lunch", "snack", "dinner"] as const;
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function PlanPage() {
  const profile = useProfile();
  const plans = usePlans();
  const activePlanId = plans[0]?.id ?? null;
  const meals = usePlanMeals(activePlanId);
  const [loading, setLoading] = useState(false);

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
              <div className="mt-2 space-y-2">
                {SLOTS.map((slot) => {
                  const meal = meals.find(
                    (m) => m.dayIndex === dayIndex && m.slot === slot,
                  );
                  return (
                    <div key={slot} className="rounded-md bg-muted p-2 text-sm">
                      <span className="text-muted-foreground">{slot}</span>
                      <p className="truncate">{meal ? meal.recipeId : "—"}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </PageReveal>
  );
}
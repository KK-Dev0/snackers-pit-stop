"use client";

import { useEffect, useState } from "react";
import { liveQuery } from "dexie";

import { getDb } from "../db/dexie";
import type { Plan, PlanMeal } from "@/lib/schemas";

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);

  useEffect(() => {
    const db = getDb();
    const sub = liveQuery(() => db.plans.toArray()).subscribe({
      next: (value) => setPlans(value as Plan[]),
      error: (err) => console.error(err),
    });
    return () => sub.unsubscribe();
  }, []);

  return plans;
}

export function usePlanMeals(planId: string | null) {
  const [state, setState] = useState<{ planId: string | null; meals: PlanMeal[] }>({
    planId,
    meals: [],
  });

  useEffect(() => {
    if (!planId) return;
    const db = getDb();
    const sub = liveQuery(() =>
      db.planMeals.where("planId").equals(planId).toArray(),
    ).subscribe({
      next: (value) => setState({ planId, meals: value as PlanMeal[] }),
      error: (err) => console.error(err),
    });
    return () => sub.unsubscribe();
  }, [planId]);

  return state.planId === planId ? state.meals : [];
}
import { getDb } from "../dexie";
import type { Plan, PlanMeal } from "@/lib/schemas";

export async function listPlans(): Promise<Plan[]> {
  const db = getDb();
  return db.plans.toArray();
}

export async function getPlan(id: string): Promise<Plan | undefined> {
  const db = getDb();
  return db.plans.get(id);
}

export async function getPlanByWeekStart(weekStart: string): Promise<Plan | undefined> {
  const db = getDb();
  const all = await db.plans.toArray();
  return all.find((p: Plan) => p.weekStart === weekStart);
}

export async function savePlan(plan: Plan): Promise<void> {
  const db = getDb();
  await db.plans.put(plan);
}

export async function deletePlan(id: string): Promise<void> {
  const db = getDb();
  await db.planMeals.where("planId").equals(id).delete();
  await db.plans.delete(id);
}

export async function listPlanMeals(planId: string): Promise<PlanMeal[]> {
  const db = getDb();
  return db.planMeals.where("planId").equals(planId).toArray();
}

export async function savePlanMeal(meal: PlanMeal): Promise<void> {
  const db = getDb();
  await db.planMeals.put(meal);
}

export async function deletePlanMeal(id: string): Promise<void> {
  const db = getDb();
  await db.planMeals.delete(id);
}

export async function deletePlanMeals(planId: string): Promise<void> {
  const db = getDb();
  await db.planMeals.where("planId").equals(planId).delete();
}
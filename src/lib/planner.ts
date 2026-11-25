import type { DietType, MealSlot, Plan, PlanMeal, Recipe } from "@/lib/schemas";

export type PlannerLock = {
  dayIndex: number;
  slot: MealSlot;
  recipeId: string;
  recipeSource: "catalog" | "local";
  servings: number;
};

export type PlannerOptions = {
  recipes: Recipe[];
  diet?: DietType;
  allergens?: string[];
  dislikes?: string[];
  calorieGoal?: number;
  weeklyBudget?: number;
  servings?: number;
  seed?: number | string;
  locks?: PlannerLock[];
  weekStart?: string;
};

function hashSeed(seed: number | string | undefined): number {
  if (seed === undefined) return 12345;
  if (typeof seed === "number") return seed >>> 0;
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  return h || 1;
}

function mulberry32(a: number) {
  return function () {
    let t = (a += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function isDietCompatible(recipeDiet: string, userDiet?: DietType): boolean {
  const rank: Record<string, number> = { vegan: 0, veg: 1, eggetarian: 2, nonveg: 3 };
  if (!userDiet) return true;
  const r = rank[recipeDiet];
  const u = rank[userDiet];
  if (r === undefined || u === undefined) return true;
  return r <= u;
}

function hasAllergen(recipe: Recipe, allergens: string[]): boolean {
  if (!allergens.length) return false;
  const set = new Set(allergens.map((a) => a.toLowerCase()));
  return (recipe.allergens ?? []).some((a) => set.has(String(a).toLowerCase()));
}

function matchesDislike(recipe: Recipe, dislikes: string[]): boolean {
  if (!dislikes.length) return false;
  const haystack = [recipe.title, recipe.description, ...(recipe.tags ?? [])]
    .join(" ")
    .toLowerCase();
  return dislikes.some((d) => d && haystack.includes(d.toLowerCase()));
}

export function eligibleRecipes(
  recipes: Recipe[],
  slot: string,
  diet?: DietType,
  allergens: string[] = [],
  dislikes: string[] = [],
): Recipe[] {
  return recipes.filter((r) => {
    if (!(r.mealSlots ?? []).includes(slot as MealSlot)) return false;
    if (!isDietCompatible(r.diet, diet)) return false;
    if (hasAllergen(r, allergens)) return false;
    if (matchesDislike(r, dislikes)) return false;
    return true;
  });
}

export function generatePlan(options: PlannerOptions): { plan: Plan; meals: PlanMeal[] } {
  const {
    recipes,
    diet,
    allergens = [],
    dislikes = [],
    servings = 2,
    seed,
    locks = [],
    weekStart = new Date().toISOString().slice(0, 10),
  } = options;

  const rng = mulberry32(hashSeed(seed));
  const planId = `plan-${weekStart}`;
  const lockMap = new Map<string, PlannerLock>();
  for (const l of locks) lockMap.set(`${l.dayIndex}:${l.slot}`, l);

  const meals: PlanMeal[] = [];
  const usedBySlot = new Map<string, Set<string>>();

  const slots = ["breakfast", "lunch", "snack", "dinner"] as const;

  for (let day = 0; day < 7; day++) {
    for (const slot of slots) {
      const key = `${day}:${slot}`;
      const lock = lockMap.get(key);
      if (lock) {
        meals.push({
          id: `${planId}-${day}-${slot}`,
          planId,
          dayIndex: day,
          slot,
          recipeId: lock.recipeId,
          recipeSource: lock.recipeSource,
          servings: lock.servings,
          locked: true,
          sortOrder: 0,
        });
        continue;
      }

      const pool = eligibleRecipes(recipes, slot, diet, allergens, dislikes);
      if (pool.length === 0) continue;

      if (!usedBySlot.has(slot)) usedBySlot.set(slot, new Set());
      const used = usedBySlot.get(slot)!;

      // prefer unused
      let candidates = pool.filter((r) => !used.has(r.id));
      if (candidates.length === 0) candidates = pool;

      // seeded pick
      const idx = Math.floor(rng() * candidates.length);
      const chosen = candidates[idx];

      used.add(chosen.id);

      meals.push({
        id: `${planId}-${day}-${slot}`,
        planId,
        dayIndex: day,
        slot,
        recipeId: chosen.id,
        recipeSource: "catalog",
        servings,
        locked: false,
        sortOrder: 0,
      });
    }
  }

  const plan: Plan = {
    id: planId,
    weekStart,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  return { plan, meals };
}
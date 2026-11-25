"use client";

import Link from "next/link";
import { UserRoundIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";
import { useProfile } from "@/client/hooks/use-profile";
import { getDb } from "@/client/db/dexie";
import { Button } from "@/components/ui/button";

export default function MePage() {
  const profile = useProfile();

  if (profile === undefined) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
        <PageHeader eyebrow="On this device" title="Me" description="Loading…" />
      </PageReveal>
    );
  }

  if (!profile) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
        <PageHeader
          eyebrow="On this device"
          title="Me"
          description="Diet, goals, budget, stores and your data. No account, no sign-in."
        />
        <EmptyState
          icon={UserRoundIcon}
          title="No profile yet"
          description="Your onboarding answers will show up here, ready to edit whenever life changes."
        />
        <Link href="/onboarding" className="text-primary underline">
          Start onboarding
        </Link>
      </PageReveal>
    );
  }

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="On this device"
        title="Me"
        description="Diet, goals, budget, stores and your data. No account, no sign-in."
      />
      <div className="rounded-lg border bg-card p-6 space-y-2">
        <p>
          <strong>Diet:</strong> {profile.diet}
        </p>
        <p>
          <strong>Servings:</strong> {profile.servings}
        </p>
        <p>
          <strong>Calorie goal:</strong> {profile.calorieGoal} kcal/day
        </p>
        <p>
          <strong>Weekly budget:</strong> ₹{profile.weeklyBudgetInr}
        </p>
        <p>
          <strong>Allergens:</strong> {profile.allergens.join(", ") || "none"}
        </p>
        <p>
          <strong>Dislikes:</strong> {profile.dislikes.join(", ") || "none"}
        </p>
        <p>
          <strong>Pincode:</strong> {profile.pincode ?? "not set"}
        </p>
        <p>
          <strong>Stores:</strong> {profile.storeIds.join(", ") || "none"}
        </p>
      </div>
      <Link href="/onboarding" className="text-primary underline">
        Edit profile
      </Link>

      <div className="rounded-lg border bg-card p-6 space-y-3">
        <h2 className="font-semibold">Data</h2>
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={async () => {
              const db = getDb();
              const data = {
                profile: await db.profile.toArray(),
                pantryItems: await db.pantryItems.toArray(),
                plans: await db.plans.toArray(),
                planMeals: await db.planMeals.toArray(),
                savedRecipes: await db.savedRecipes.toArray(),
                priceOverrides: await db.priceOverrides.toArray(),
                shoppingListState: await db.shoppingListState.toArray(),
                userStores: await db.userStores.toArray(),
                settings: await db.settings.toArray(),
              };
              const blob = new Blob([JSON.stringify(data, null, 2)], {
                type: "application/json",
              });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = "snackers-pit-stop-export.json";
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            Export JSON
          </Button>
          <label className="inline-flex">
            <input
              type="file"
              accept="application/json"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const text = await file.text();
                try {
                  const data = JSON.parse(text);
                  const db = getDb();
                  await db.transaction(
                    "rw",
                    [
                      db.profile,
                      db.pantryItems,
                      db.plans,
                      db.planMeals,
                      db.savedRecipes,
                      db.priceOverrides,
                      db.shoppingListState,
                      db.userStores,
                      db.settings,
                    ],
                    async () => {
                      await db.profile.clear();
                      await db.pantryItems.clear();
                      await db.plans.clear();
                      await db.planMeals.clear();
                      await db.savedRecipes.clear();
                      await db.priceOverrides.clear();
                      await db.shoppingListState.clear();
                      await db.userStores.clear();
                      await db.settings.clear();
                      if (Array.isArray(data.profile)) await db.profile.bulkPut(data.profile);
                      if (Array.isArray(data.pantryItems)) await db.pantryItems.bulkPut(data.pantryItems);
                      if (Array.isArray(data.plans)) await db.plans.bulkPut(data.plans);
                      if (Array.isArray(data.planMeals)) await db.planMeals.bulkPut(data.planMeals);
                      if (Array.isArray(data.savedRecipes)) await db.savedRecipes.bulkPut(data.savedRecipes);
                      if (Array.isArray(data.priceOverrides)) await db.priceOverrides.bulkPut(data.priceOverrides);
                      if (Array.isArray(data.shoppingListState)) await db.shoppingListState.bulkPut(data.shoppingListState);
                      if (Array.isArray(data.userStores)) await db.userStores.bulkPut(data.userStores);
                      if (Array.isArray(data.settings)) await db.settings.bulkPut(data.settings);
                    },
                  );
                  alert("Import complete");
                } catch (err) {
                  alert("Import failed: " + (err as Error).message);
                }
                e.target.value = "";
              }}
            />
            <Button type="button" variant="outline" asChild>
              <span>Import JSON</span>
            </Button>
          </label>
          <Button
            type="button"
            variant="destructive"
            onClick={async () => {
              if (!confirm("Clear all local data?")) return;
              const db = getDb();
              await db.transaction(
                "rw",
                [
                  db.profile,
                  db.pantryItems,
                  db.plans,
                  db.planMeals,
                  db.savedRecipes,
                  db.priceOverrides,
                  db.shoppingListState,
                  db.userStores,
                  db.settings,
                ],
                async () => {
                  await db.profile.clear();
                  await db.pantryItems.clear();
                  await db.plans.clear();
                  await db.planMeals.clear();
                  await db.savedRecipes.clear();
                  await db.priceOverrides.clear();
                  await db.shoppingListState.clear();
                  await db.userStores.clear();
                  await db.settings.clear();
                },
              );
            }}
          >
            Clear all data
          </Button>
        </div>
      </div>
    </PageReveal>
  );
}
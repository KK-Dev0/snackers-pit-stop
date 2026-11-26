"use client";

import Link from "next/link";
import { UserRoundIcon } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { useProfile } from "@/client/hooks/use-profile";
import { getDb } from "@/client/db/dexie";
import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageHeaderSkeleton } from "@/components/common/states";
import { PageReveal } from "@/components/motion/page-reveal";
import { Button } from "@/components/ui/button";

function AboutLink() {
  return (
    <div className="text-sm">
      <Link href="/about" className="text-primary underline underline-offset-4">
        About &amp; disclaimers
      </Link>
      <p className="mt-1 text-muted-foreground">
        Estimates, best-effort allergen filtering and store handoff explained.
      </p>
    </div>
  );
}

type DataAction = "export" | "import" | "clear";

export default function MePage() {
  const profile = useProfile();
  const importInputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<DataAction | null>(null);

  const runDataAction = async (
    action: DataAction,
    labels: { loading: string; success: string; error: string },
    work: () => Promise<void>,
  ) => {
    const id = toast.loading(labels.loading);
    setBusy(action);
    try {
      await work();
      toast.success(labels.success, { id });
    } catch (error) {
      toast.error(labels.error, {
        id,
        description: error instanceof Error ? error.message : "Please try again.",
        action: {
          label: "Retry",
          onClick: () => void runDataAction(action, labels, work),
        },
      });
    } finally {
      setBusy(null);
    }
  };

  const exportData = () =>
    runDataAction(
      "export",
      { loading: "Preparing export…", success: "Export downloaded", error: "Export failed" },
      async () => {
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
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement("a");
        anchor.href = url;
        anchor.download = "snackers-pit-stop-export.json";
        anchor.click();
        URL.revokeObjectURL(url);
      },
    );

  const importData = (file: File) =>
    runDataAction(
      "import",
      { loading: "Importing data…", success: "Import complete", error: "Import failed" },
      async () => {
        const data: unknown = JSON.parse(await file.text());
        if (!data || typeof data !== "object") throw new Error("The file is not a backup export.");
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
            const record = data as Record<string, unknown>;
            await db.profile.clear();
            await db.pantryItems.clear();
            await db.plans.clear();
            await db.planMeals.clear();
            await db.savedRecipes.clear();
            await db.priceOverrides.clear();
            await db.shoppingListState.clear();
            await db.userStores.clear();
            await db.settings.clear();
            for (const key of Object.keys(record)) {
              const table = (
                db as unknown as Record<string, { bulkPut: (rows: unknown[]) => Promise<unknown> }>
              )[key];
              if (table && Array.isArray(record[key]))
                await table.bulkPut(record[key] as unknown[]);
            }
          },
        );
      },
    );

  const clearData = () =>
    runDataAction(
      "clear",
      { loading: "Clearing data…", success: "Local data cleared", error: "Could not clear data" },
      async () => {
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
      },
    );

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      {profile === undefined ? (
        <PageHeaderSkeleton />
      ) : !profile ? (
        <>
          <PageHeader
            eyebrow="On this device"
            title="Me"
            description="Diet, goals, budget, stores and your data. No account, no sign-in."
          />
          <EmptyState
            icon={UserRoundIcon}
            title="No profile yet"
            description="Your onboarding answers will show up here, ready to edit whenever life changes."
            action={
              <Button asChild>
                <Link href="/onboarding">Start onboarding</Link>
              </Button>
            }
          />
          <AboutLink />
        </>
      ) : (
        <>
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
          <AboutLink />

          <div className="rounded-lg border bg-card p-6 space-y-3">
            <h2 className="font-semibold">Data</h2>
            <p className="text-sm text-muted-foreground">
              Export a backup, restore it on this device, or start fresh. Nothing leaves your
              device.
            </p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={() => void exportData()}
              >
                {busy === "export" ? "Preparing…" : "Export JSON"}
              </Button>
              <input
                id="backup-import"
                name="backupImport"
                ref={importInputRef}
                type="file"
                accept="application/json"
                className="sr-only"
                tabIndex={-1}
                aria-hidden="true"
                onChange={async (event) => {
                  const file = event.target.files?.[0];
                  event.target.value = "";
                  if (
                    file &&
                    window.confirm(
                      "Import this backup? It replaces the data currently on this device.",
                    )
                  ) {
                    await importData(file);
                  }
                }}
              />
              <Button
                type="button"
                variant="outline"
                disabled={busy !== null}
                onClick={() => importInputRef.current?.click()}
              >
                {busy === "import" ? "Importing…" : "Import JSON"}
              </Button>
              <Button
                type="button"
                variant="destructive"
                disabled={busy !== null}
                onClick={() => {
                  if (window.confirm("Clear all local data? This cannot be undone.")) {
                    void clearData();
                  }
                }}
              >
                {busy === "clear" ? "Clearing…" : "Clear all data"}
              </Button>
            </div>
          </div>
        </>
      )}
    </PageReveal>
  );
}

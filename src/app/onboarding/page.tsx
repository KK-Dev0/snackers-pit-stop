"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
// no radio-group component; use buttons instead
import { Input } from "@/components/ui/input";
import { getProfile, saveProfile } from "@/client/db/repos/profile";
import { useStores } from "@/client/hooks/use-stores";
import { ErrorState } from "@/components/common/error-state";
import { StoreListSkeleton } from "@/components/common/states";
import { PincodeField } from "@/components/stores/pincode-field";
import { StorePicker } from "@/components/stores/store-picker";
import { isPincode } from "@/lib/geo";
import type { Profile } from "@/lib/schemas";

const STEPS = ["Diet", "Goals", "Preferences", "Location & stores"];

const DIETS = ["vegan", "veg", "eggetarian", "nonveg"] as const;

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const [diet, setDiet] = useState<(typeof DIETS)[number]>("veg");
  const [servings, setServings] = useState(2);
  const [calorieGoal, setCalorieGoal] = useState(2000);
  const [weeklyBudget, setWeeklyBudget] = useState(2000);
  const [allergens, setAllergens] = useState<string[]>([]);
  const [dislikes, setDislikes] = useState("");
  const [pincode, setPincode] = useState("");
  const [storeIds, setStoreIds] = useState<string[]>([]);
  const [customStoreName, setCustomStoreName] = useState<string>("");
  const [storeAttempt, setStoreAttempt] = useState(0);
  const [saving, setSaving] = useState(false);
  const {
    items: stores,
    hasAvailabilityData,
    loading,
    error: storesError,
  } = useStores(pincode, storeAttempt);

  // Editing an existing profile must preserve the pincode and store picks.
  const hydrated = useRef(false);
  useEffect(() => {
    void getProfile()
      .then((saved) => {
        if (!saved || hydrated.current) return;
        hydrated.current = true;
        setDiet(saved.diet ?? "veg");
        setServings(saved.servings ?? 2);
        setCalorieGoal(saved.calorieGoal ?? 2000);
        setWeeklyBudget(saved.weeklyBudgetInr ?? 2000);
        setAllergens(saved.allergens ?? []);
        setDislikes((saved.dislikes ?? []).join(", "));
        setPincode(saved.pincode ?? "");
        setStoreIds(saved.storeIds ?? []);
        setCustomStoreName(saved.customStoreName ?? "");
      })
      .catch(() => undefined);
  }, []);

  const skip = () => router.push("/plan");

  const next = async () => {
    if (step < STEPS.length - 1) {
      setStep(step + 1);
      return;
    }
    const profile: Profile = {
      id: "me",
      diet,
      servings,
      calorieGoal,
      weeklyBudgetInr: weeklyBudget,
      allergens: allergens as Profile["allergens"],
      dislikes: dislikes
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean),
      pincode: isPincode(pincode) ? pincode : undefined,
      storeIds,
      customStoreName: customStoreName || undefined,
      onboardedAt: Date.now(),
      updatedAt: Date.now(),
    };
    if (servings < 1 || calorieGoal < 1 || weeklyBudget < 1) {
      toast.error("Enter positive numbers for servings, calories and budget.");
      return;
    }
    setSaving(true);
    try {
      await saveProfile(profile);
      toast.success("Profile saved");
      router.push("/plan");
    } catch {
      toast.error("Could not save your profile. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  };
  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <main id="main-content" className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6">
        <Progress
          value={((step + 1) / STEPS.length) * 100}
          aria-label={`Step ${step + 1} of ${STEPS.length}`}
        />
        <p aria-live="polite" className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">{STEPS[step]}</h1>

        {step === 0 && (
          <div className="mt-4 space-y-4">
            <div>
              <Label id="diet-label">Diet type</Label>
              <div role="group" aria-labelledby="diet-label" className="mt-2 flex flex-wrap gap-2">
                {DIETS.map((d) => (
                  <Button
                    key={d}
                    type="button"
                    variant={diet === d ? "default" : "outline"}
                    aria-pressed={diet === d}
                    onClick={() => setDiet(d)}
                  >
                    {d}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <Label htmlFor="servings">Household servings</Label>
              <Input
                id="servings"
                type="number"
                value={servings}
                onChange={(e) => setServings(Number(e.target.value))}
                min={1}
                max={20}
              />
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="calorie-goal">Calorie goal (per day)</Label>
              <Input
                id="calorie-goal"
                type="number"
                value={calorieGoal}
                onChange={(e) => setCalorieGoal(Number(e.target.value))}
              />
            </div>
            <div>
              <Label htmlFor="weekly-budget">Weekly budget (INR)</Label>
              <Input
                id="weekly-budget"
                type="number"
                value={weeklyBudget}
                onChange={(e) => setWeeklyBudget(Number(e.target.value))}
              />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="mt-4 space-y-4">
            <div>
              <Label htmlFor="allergens">Allergens (comma separated)</Label>
              <Input
                id="allergens"
                value={allergens.join(", ")}
                onChange={(e) =>
                  setAllergens(
                    e.target.value
                      .split(",")
                      .map((s) => s.trim())
                      .filter(Boolean),
                  )
                }
              />
            </div>
            <div>
              <Label htmlFor="dislikes">Dislikes (comma separated)</Label>
              <Input id="dislikes" value={dislikes} onChange={(e) => setDislikes(e.target.value)} />
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="mt-4 space-y-4">
            <PincodeField value={pincode} onChange={setPincode} />
            {isPincode(pincode) ? (
              storesError ? (
                <ErrorState
                  compact
                  title="Stores could not load"
                  description="Check your connection and try again. You can still continue without store picks."
                  retry={() => setStoreAttempt((attempt) => attempt + 1)}
                />
              ) : loading && stores.length === 0 ? (
                <StoreListSkeleton />
              ) : (
                <StorePicker
                  pincode={pincode}
                  stores={stores}
                  hasAvailabilityData={hasAvailabilityData}
                  selectedIds={storeIds}
                  onChange={(ids, customName) => {
                    setStoreIds(ids);
                    setCustomStoreName(customName ?? "");
                  }}
                  onCustomNameChange={setCustomStoreName}
                />
              )
            ) : (
              <p className="text-sm text-muted-foreground">
                Enter a valid pincode to pick the stores you use.
              </p>
            )}
          </div>
        )}
      </section>

      <div className="mt-6 flex items-center justify-between">
        <Button variant="ghost" onClick={skip}>
          Skip
        </Button>
        <div className="flex gap-2">
          {step > 0 && (
            <Button variant="outline" onClick={back}>
              Back
            </Button>
          )}
          <Button onClick={next} disabled={saving}>
            {saving ? "Saving…" : step === STEPS.length - 1 ? "Finish" : "Next"}
          </Button>
        </div>
      </div>
    </main>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

const STEPS = ["Diet", "Goals", "Preferences", "Location & stores"];

export default function OnboardingPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);

  const skip = () => {
    router.push("/plan");
  };

  const next = () => {
    if (step < STEPS.length - 1) setStep(step + 1);
    else router.push("/plan");
  };

  const back = () => {
    if (step > 0) setStep(step - 1);
  };

  return (
    <main className="mx-auto max-w-md px-4 py-8">
      <div className="mb-6">
        <Progress value={((step + 1) / STEPS.length) * 100} />
        <p className="mt-2 text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: {STEPS[step]}
        </p>
      </div>

      <section className="rounded-lg border bg-card p-6">
        <h1 className="text-xl font-semibold">{STEPS[step]}</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Onboarding step content coming soon.
        </p>
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
          <Button onClick={next}>{step === STEPS.length - 1 ? "Finish" : "Next"}</Button>
        </div>
      </div>
    </main>
  );
}
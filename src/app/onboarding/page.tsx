import Link from "next/link";
import { ArrowRightIcon } from "lucide-react";

import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

export const metadata = { title: "Get started" };

export default function OnboardingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <header className="mx-auto flex h-16 w-full max-w-3xl items-center justify-between px-5 sm:px-6">
        <Wordmark />
        <ThemeToggle />
      </header>

      <main id="main-content" className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-6 px-5 py-12 sm:px-6">
        <div className="space-y-3">
          <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
            Four quick steps · skippable
          </p>
          <h1 className="font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl">
            Let&apos;s set up your pit stop.
          </h1>
          <p className="max-w-xl text-base text-pretty text-muted-foreground">
            Diet, calories, budget, allergens, location and the shops you use. All of it stays on
            this device.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-soft">
          <h2 className="font-display text-xl font-semibold">Wizard coming next</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            The setup wizard arrives with the onboarding milestone. Until then you can head straight
            to the app.
          </p>
          <Button asChild className="mt-4">
            <Link href="/plan">
              Continue to Plan
              <ArrowRightIcon aria-hidden="true" />
            </Link>
          </Button>
        </div>
      </main>
    </div>
  );
}

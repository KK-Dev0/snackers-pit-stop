import { ArrowRightIcon } from "lucide-react";

import { CheckeredFlag } from "@/components/landing/checkered-flag";
import { Button } from "@/components/ui/button";

const RECIPES_HREF = "/recipes";

export function FinalCta() {
  return (
    <section className="scroll-mt-8 animated-gradient">
      <div className="mx-auto w-full max-w-5xl px-5 pb-16 sm:px-6 lg:pb-24">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-card px-6 py-12 text-center shadow-soft sm:px-10 sm:py-16">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-24 left-1/2 hidden size-72 -translate-x-1/2 rounded-full bg-primary/10 blur-3xl sm:block"
          />
          <div className="relative mx-auto flex max-w-xl flex-col items-center">
            <CheckeredFlag />
            <h2 className="mt-4 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
              Your week is one tap away.
            </h2>
            <p className="mt-3 text-base text-pretty text-muted-foreground">
              Set your diet, budget and pantry once. Then let the pit stop handle the planning and
              the list.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <a href="/onboarding">
                  Plan my week
                  <ArrowRightIcon aria-hidden="true" />
                </a>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
                <a href={RECIPES_HREF}>Browse recipes</a>
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Free forever · No account · Works offline
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

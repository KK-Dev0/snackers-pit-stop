"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRightIcon, ShieldCheckIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CheckeredFlag } from "@/components/landing/checkered-flag";
import { PitBoard } from "@/components/landing/pit-board";
import { StaggerItem, StaggerList } from "@/components/motion/stagger-list";
import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";

const TRUST_POINTS = ["Free forever", "No account", "Stays on your device"];

export function Hero() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative overflow-hidden">
      {/* Soft saffron wash behind the pit board. Decorative only. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 right-[-15%] size-[34rem] rounded-full bg-primary/10 blur-3xl"
      />

      <div className="relative mx-auto grid w-full max-w-5xl gap-12 px-5 pt-8 pb-14 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-14 lg:pt-16 lg:pb-24">
        <StaggerList className="max-w-xl">
          <StaggerItem>
            <p className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase shadow-soft">
              <CheckeredFlag className="scale-75" />
              A pit stop for hungry people
            </p>
          </StaggerItem>

          <StaggerItem>
            <h1 className="mt-5 font-display text-5xl leading-[1.02] font-semibold tracking-tight text-balance sm:text-6xl lg:text-[4.25rem]">
              Plan the week.
              <br />
              <span className="text-accent">Shop once.</span>
            </h1>
          </StaggerItem>

          <StaggerItem>
            <p className="mt-5 max-w-lg text-lg text-pretty text-muted-foreground">
              Seven days of meals built around your diet, calorie goal, budget and pantry — then
              one merged list, ready to hand off to the shops you already use.
            </p>
          </StaggerItem>

          <StaggerItem>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Button asChild size="lg" className="h-11 px-5 text-base">
                <Link href="/onboarding">
                  Plan my week
                  <ArrowRightIcon aria-hidden="true" />
                </Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-11 px-5 text-base">
                <Link href="/recipes">Browse recipes</Link>
              </Button>
            </div>
          </StaggerItem>

          <StaggerItem>
            <ul className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {TRUST_POINTS.map((point) => (
                <li key={point} className="inline-flex items-center gap-1.5">
                  <ShieldCheckIcon aria-hidden="true" className="size-4 text-accent" />
                  {point}
                </li>
              ))}
            </ul>
          </StaggerItem>
        </StaggerList>

        <motion.div
          initial={reduceMotion ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: motionTokens.duration.slow, ease: [...motionTokens.ease], delay: 0.12 }}
          className="relative"
        >
          <PitBoard />
          <p className="mt-3 text-center text-xs text-muted-foreground">
            Illustrative plan. All nutrition and costs are estimates.
          </p>
        </motion.div>
      </div>

      {/* Pit-lane divider. */}
      <div
        aria-hidden="true"
        className="mx-auto h-px w-full max-w-5xl bg-[repeating-linear-gradient(to_right,var(--border)_0_18px,transparent_18px_32px)]"
      />
    </section>
  );
}

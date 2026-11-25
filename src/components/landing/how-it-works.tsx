import { CalendarCheckIcon, ShoppingBasketIcon, SlidersHorizontalIcon } from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";

const STEPS = [
  {
    icon: SlidersHorizontalIcon,
    title: "Set your lane",
    description:
      "Diet, calorie goal, weekly budget, allergens, pincode and the shops you actually use. Takes about a minute, skippable at every step.",
  },
  {
    icon: CalendarCheckIcon,
    title: "Plan the week",
    description:
      "One tap builds seven days of breakfast, lunch, snacks and dinner around your rules. Swap a meal, lock the ones you love, drag to reorder.",
  },
  {
    icon: ShoppingBasketIcon,
    title: "Shop once",
    description:
      "Ingredients merge into one list, units combine, the pantry is subtracted and everything is grouped by aisle — ready to hand off.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="scroll-mt-8">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Three steps, one weekly shop"
          description="No spreadsheets, no guesswork, no twenty open tabs of recipes."
        />

        <ol className="mt-10 grid gap-4 sm:grid-cols-3 sm:gap-5">
          {STEPS.map(({ icon: Icon, title, description }, index) => (
            <li
              key={title}
              className="relative rounded-2xl border border-border bg-card p-5 shadow-soft sm:p-6"
            >
              <div className="flex items-center justify-between">
                <span className="flex size-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span
                  aria-hidden="true"
                  className="font-display text-3xl font-semibold text-border"
                >
                  {String(index + 1).padStart(2, "0")}
                </span>
              </div>
              <h3 className="mt-4 font-display text-xl font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>
            </li>
          ))}
        </ol>

        <div
          aria-hidden="true"
          className="mt-12 h-px w-full bg-[repeating-linear-gradient(to_right,var(--border)_0_18px,transparent_18px_32px)]"
        />
      </div>
    </section>
  );
}

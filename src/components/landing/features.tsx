import {
  CookingPotIcon,
  FlameIcon,
  ListChecksIcon,
  ScanLineIcon,
  StoreIcon,
  WalletIcon,
} from "lucide-react";

import { SectionHeading } from "@/components/common/section-heading";

const FEATURES = [
  {
    icon: WalletIcon,
    title: "Budget-first planning",
    description:
      "Daily and weekly cost estimates sit next to every meal, with a fuel-gauge meter against the budget you set.",
  },
  {
    icon: FlameIcon,
    title: "Calories from real ingredients",
    description:
      "Calories and macros are computed in code from a seeded ingredient table — never invented by a model. Always labelled as estimates.",
  },
  {
    icon: CookingPotIcon,
    title: "The pantry goes first",
    description:
      "Recipes that use what is already at home rank higher, so less food is wasted and fewer things get bought twice.",
  },
  {
    icon: ScanLineIcon,
    title: "Import any recipe",
    description:
      "Paste a link or snap a photo of a recipe. Structured data is read first, and you review the draft before it is saved.",
  },
  {
    icon: ListChecksIcon,
    title: "One merged list",
    description:
      "Every meal in the week collapses into a single list: units converted, duplicates merged, pantry subtracted, aisle by aisle.",
  },
  {
    icon: StoreIcon,
    title: "Handoff, not lock-in",
    description:
      "Open-and-search links for the shops you use. No logins, no ordering inside the app, and always a plain-text copy for WhatsApp.",
  },
];

export function Features() {
  return (
    <section className="scroll-mt-8 animated-gradient">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-6 lg:py-20">
        <SectionHeading
          eyebrow="What you get"
          title="Built for the whole week, not just dinner"
          description="Everything here is designed for a tight budget and a small kitchen."
        />

        <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="rounded-2xl border border-border bg-card p-5 shadow-soft transition-colors hover:border-primary/40"
            >
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Icon aria-hidden="true" className="size-5" />
              </span>
              <h3 className="mt-4 font-display text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-pretty text-muted-foreground">{description}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

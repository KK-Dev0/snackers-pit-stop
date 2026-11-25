import Link from "next/link";
import type { Metadata } from "next";

import { SiteFooter } from "@/components/landing/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "About & disclaimers",
  description: "How Snackers Pit Stop estimates nutrition and prices, and what you should verify yourself.",
};

const SECTIONS = [
  {
    title: "Not medical advice",
    body: "Meal ideas and nutrition figures are general information, not medical or dietary advice. If you have a medical condition or a clinical nutrition plan, follow your clinician's guidance.",
  },
  {
    title: "Nutrition and prices are estimates",
    body: "Calories and macros are calculated in code from a per-100 g/ml reference table for common ingredients. Prices are rough, seeded ₹ defaults that you can edit; there is no live price scraping. Always check the pack label and your final bill.",
  },
  {
    title: "Allergen filtering is best-effort",
    body: "Diet and allergen tags come from ingredient data and imported recipes, so they can be incomplete or wrong. Never rely on the app to make an allergy decision — read every label, especially for imported recipes and packaged foods.",
  },
  {
    title: "Stores are handoff only",
    body: "Store names are shown as plain text. We are not affiliated with, endorsed by, or connected to any store listed here, and the app does not scrape, log in, order, or copy a store's interface. Search links are built from templates that must be verified per store; availability starting with Asansol pincodes is unverified seed data and is still being crowdsourced.",
  },
  {
    title: "Private by default",
    body: "There is no account and no sign-in. Your profile, pantry, plans and list stay in this browser on this device. Location is optional: coordinates are used only to look up a pincode and are never stored. Imported recipes stay on your device too.",
  },
];

export default function AboutPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main id="main-content" className="mx-auto w-full max-w-3xl flex-1 px-5 py-10 sm:px-6 sm:py-16">
        <p className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
          Good to know
        </p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
          About & disclaimers
        </h1>
        <p className="mt-4 text-base text-pretty text-muted-foreground">
          Snackers Pit Stop is a free meal planner for students and young professionals in India.
          No paywall, no ads, no account. Here is what the numbers mean — and what they do not.
        </p>

        <div className="mt-10 space-y-4">
          {SECTIONS.map(({ title, body }) => (
            <section key={title} className="rounded-lg border bg-card p-5 shadow-soft sm:p-6">
              <h2 className="font-display text-xl font-semibold">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">{body}</p>
            </section>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <Link href="/plan">Plan my week</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/me">Back to Me</Link>
          </Button>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

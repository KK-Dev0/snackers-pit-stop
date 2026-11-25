import Link from "next/link";

import { Wordmark } from "@/components/layout/wordmark";

const APP_LINKS = [
  { href: "/plan", label: "Plan" },
  { href: "/recipes", label: "Recipes" },
  { href: "/pantry", label: "Pantry" },
  { href: "/list", label: "Shopping list" },
  { href: "/me", label: "Me" },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-card/60">
      <div className="mx-auto w-full max-w-5xl px-5 py-10 sm:px-6">
        <div className="grid gap-8 sm:grid-cols-[1.2fr_1fr] lg:grid-cols-[1.5fr_1fr_1fr]">
          <div>
            <Wordmark />
            <p className="mt-3 max-w-xs text-sm text-muted-foreground">
              A free, private meal planner for students and young professionals in India.
            </p>
          </div>

          <nav aria-label="Footer">
            <h2 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              App
            </h2>
            <ul className="mt-3 grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-1">
              {APP_LINKS.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={href}
                    className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="text-xs font-medium tracking-[0.16em] text-muted-foreground uppercase">
              Good to know
            </h2>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <Link
                  href="/about"
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  About &amp; disclaimers
                </Link>
              </li>
              <li>Nutrition and prices are estimates, not medical advice.</li>
              <li>Allergen filtering is best-effort — always check labels.</li>
              <li>No affiliation with any store listed in the app.</li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Snackers Pit Stop. Made for tight budgets.</p>
          <p>Your data stays on your device.</p>
        </div>
      </div>
    </footer>
  );
}

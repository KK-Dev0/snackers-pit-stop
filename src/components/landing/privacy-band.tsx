import { ArrowRightIcon, DownloadIcon, ShieldCheckIcon, SparklesIcon } from "lucide-react";

import { Button } from "@/components/ui/button";

const PROMISES = [
  {
    icon: SparklesIcon,
    title: "Free forever",
    description: "No paywall, no ads, no premium tier hiding the useful parts.",
  },
  {
    icon: ShieldCheckIcon,
    title: "Private by default",
    description: "No account, no tracking pixels. Your pincode is the only location we keep.",
  },
  {
    icon: DownloadIcon,
    title: "Yours to take",
    description:
      "Export your data as JSON, import it on another device, or clear it all in one tap.",
  },
];

export function PrivacyBand() {
  return (
    <section className="scroll-mt-8">
      <div className="mx-auto w-full max-w-5xl px-5 py-14 sm:px-6 lg:py-20">
        <div className="overflow-hidden rounded-3xl bg-accent text-accent-foreground shadow-lift">
          <div className="grid gap-10 p-6 sm:p-10 lg:grid-cols-[0.9fr_1.1fr] lg:items-center lg:gap-14">
            <div>
              <p className="text-xs font-medium tracking-[0.16em] uppercase opacity-80">
                Free, private, no signup
              </p>
              <h2 className="mt-2 font-display text-3xl leading-tight font-semibold tracking-tight text-balance sm:text-4xl">
                No paywall. No ads. No account.
              </h2>
              <p className="mt-3 text-base text-pretty opacity-85">
                Setting up takes a minute, and every answer is editable later. Your profile, pantry
                and plans live in this browser — not on a server.
              </p>
              <Button
                asChild
                size="lg"
                className="mt-6 h-11 bg-accent-foreground px-5 text-base text-accent hover:bg-accent-foreground/90"
              >
                <a href="/onboarding">
                  Start planning
                  <ArrowRightIcon aria-hidden="true" />
                </a>
              </Button>
            </div>

            <ul className="grid gap-3">
              {PROMISES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex gap-3 rounded-2xl bg-accent-foreground/10 p-4">
                  <span className="mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-xl bg-accent-foreground/15">
                    <Icon aria-hidden="true" className="size-4.5" />
                  </span>
                  <div>
                    <h3 className="font-display text-base font-semibold">{title}</h3>
                    <p className="mt-0.5 text-sm text-pretty opacity-85">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}

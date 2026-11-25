import { CardLift } from "@/components/motion/card-lift";
import { PageReveal } from "@/components/motion/page-reveal";
import { StaggerItem, StaggerList } from "@/components/motion/stagger-list";
import { SiteHeader } from "@/components/layout/site-header";

export default function Home() {
  return (
    <div className="flex min-h-dvh flex-col">
      <SiteHeader />
      <main
        id="main-content"
        className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center px-6 py-16"
      >
        <PageReveal className="space-y-8">
          <p className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium tracking-[0.18em] text-muted-foreground uppercase shadow-soft">
            <span className="size-2 rounded-full bg-accent" aria-hidden="true" />
            Design system ready
          </p>

          <div className="space-y-4">
            <h1 className="font-display text-5xl leading-[1.05] font-semibold tracking-tight text-balance sm:text-6xl">
              A pit stop for hungry people.
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Plan the week around your diet, calories, budget and pantry — then shop once.
            </p>
          </div>

          <StaggerList className="grid gap-4 sm:grid-cols-2">
            <StaggerItem className="h-full">
              <CardLift className="h-full">
                <div className="h-full rounded-xl border border-border bg-card p-5 shadow-soft">
                  <h2 className="font-display text-xl font-semibold">Warm by default</h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Cream surfaces, forest ink and a saffron accent for primary actions.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary px-3 py-1 text-xs font-medium text-primary-foreground">
                      Primary
                    </span>
                    <span className="rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
                      Accent
                    </span>
                    <span className="rounded-full bg-destructive px-3 py-1 text-xs font-medium text-destructive-foreground">
                      Alert
                    </span>
                    <span className="rounded-full bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                      Muted
                    </span>
                  </div>
                </div>
              </CardLift>
            </StaggerItem>

            <StaggerItem className="h-full">
              <CardLift className="h-full">
                <div className="h-full rounded-xl bg-primary p-5 text-primary-foreground shadow-lift">
                  <h2 className="font-display text-xl font-semibold">Fuel-gauge ready</h2>
                  <p className="mt-1 text-sm">
                    Radii, layered shadows and the checkered-flag accent build on these tokens.
                  </p>
                </div>
              </CardLift>
            </StaggerItem>
          </StaggerList>
        </PageReveal>
      </main>
    </div>
  );
}

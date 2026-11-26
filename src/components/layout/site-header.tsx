import { Wordmark } from "@/components/layout/wordmark";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/components/ui/button";

/** Public header for the landing page and onboarding — no tab bar out here. */
export function SiteHeader() {
  return (
    <header className="mx-auto flex h-16 w-full max-w-5xl items-center justify-between px-5 sm:px-6">
      <Wordmark />
      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <Button asChild variant="outline" size="lg" className="hidden sm:inline-flex">
          <a href="/onboarding">Get started</a>
        </Button>
      </div>
    </header>
  );
}

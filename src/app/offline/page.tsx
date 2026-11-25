import Link from "next/link";
import type { Metadata } from "next";

import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Offline",
  description: "You are offline. Your saved meals and shopping list are still here.",
};

export default function OfflinePage() {
  return (
    <main
      id="main-content"
      className="mx-auto flex min-h-dvh w-full max-w-lg flex-col items-start justify-center gap-5 px-6 py-12"
    >
      <p className="checkered-flag h-2 w-12 rounded-sm" aria-hidden="true" />
      <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        You are off the road for now.
      </h1>
      <p className="text-muted-foreground">
        No connection? No problem. Your plan, pantry and shopping list live on this device and
        will be here when you return. Recipe imports and store availability votes need the
        internet.
      </p>
      <div className="flex flex-wrap gap-3">
        <Button type="button" asChild>
          <Link href="/plan">Back to my plan</Link>
        </Button>
        <Button type="button" variant="outline" asChild>
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </main>
  );
}

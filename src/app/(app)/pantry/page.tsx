import { ShoppingBasketIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";

export const metadata = { title: "Pantry" };

export default function PantryPage() {
  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="At home"
        title="Pantry"
        description="Tell us what is already on the shelf and the plan will lean on it."
      />
      <EmptyState
        icon={ShoppingBasketIcon}
        title="Nothing in the pantry yet"
        description="Add staples and leftovers to get recipes that use them up first."
      />
    </PageReveal>
  );
}

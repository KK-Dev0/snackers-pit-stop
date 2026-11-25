import { ChefHatIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="Cookbook"
        title="Recipes"
        description="Budget-friendly home cooking, plus anything you import from a link or a photo."
      />
      <EmptyState
        icon={ChefHatIcon}
        title="The catalog is on its way"
        description="Search, filters and recipe detail land once the seed catalog is wired up."
      />
    </div>
  );
}

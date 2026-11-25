import { PageHeader } from "@/components/common/page-header";
import { ImportPanel } from "@/components/recipes/import-panel";
import { MyImports } from "@/components/recipes/my-imports";
import { RecipeBrowser } from "@/components/recipes/recipe-browser";
import { PageReveal } from "@/components/motion/page-reveal";
import { photoImportEnabled } from "@/lib/feature-flags";

export const metadata = { title: "Recipes" };

export default function RecipesPage() {
  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="Cookbook"
        title="Recipes"
        description="Budget-friendly home cooking, plus anything you import from a link or a photo."
      />
      <ImportPanel photoEnabled={photoImportEnabled()} />
      <MyImports />
      <RecipeBrowser />
    </PageReveal>
  );
}

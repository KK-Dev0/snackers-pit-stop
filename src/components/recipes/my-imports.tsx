"use client";

import Link from "next/link";
import { BookMarkedIcon, Trash2Icon } from "lucide-react";

import { useSavedRecipes } from "@/client/hooks/use-saved-recipes";
import { deleteSavedRecipe } from "@/client/db/repos/savedRecipes";
import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { RecipeSchema } from "@/lib/schemas";

export function MyImports() {
  const saved = useSavedRecipes();

  if (saved.length === 0) {
    return (
      <EmptyState
        icon={BookMarkedIcon}
        title="My imports is empty"
        description="Recipes you import from a link or photo are saved here, on this device only."
        action={
          <Button asChild variant="outline" size="sm">
            <a href="#import-heading">Import your first recipe</a>
          </Button>
        }
      />
    );
  }

  return (
    <section aria-labelledby="my-imports-heading" className="space-y-3">
      <h2 id="my-imports-heading" className="font-display text-xl font-semibold">
        My imports
      </h2>
      <ul className="grid gap-3 sm:grid-cols-2">
        {saved.map((record) => {
          const parsed = RecipeSchema.safeParse(record.recipe);
          const title = parsed.success ? parsed.data.title : "Unreadable recipe";
          return (
            <li
              key={record.id}
              className="flex items-center justify-between gap-3 rounded-xl border bg-card p-4"
            >
              <div className="min-w-0 space-y-1">
                <Link
                  href={`/recipes/local/${record.id}`}
                  className="block truncate font-medium text-primary underline-offset-4 hover:underline"
                >
                  {title}
                </Link>
                <p className="text-xs text-muted-foreground">
                  {record.sourceType} ·{" "}
                  <time dateTime={new Date(record.importedAt).toISOString()}>
                    {new Date(record.importedAt).toLocaleDateString()}
                  </time>
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${title}`}
                onClick={() => {
                  if (window.confirm(`Delete “${title}” from this device?`)) {
                    void deleteSavedRecipe(record.id);
                  }
                }}
              >
                <Trash2Icon />
              </Button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

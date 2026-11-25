import Link from "next/link";
import { ClockIcon, UtensilsIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import type { Recipe } from "@/lib/schemas";

/** Compact catalog card linking to the recipe detail route. */
export function RecipeCard({ recipe }: { recipe: Recipe }) {
  return (
    <Link
      href={`/recipes/${recipe.slug}`}
      className="group flex flex-col gap-3 rounded-2xl border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-accent/40"
    >
      <div className="space-y-1.5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-display text-lg leading-tight font-semibold group-hover:text-primary">
            {recipe.title}
          </h3>
          <Badge variant="secondary" className="capitalize">
            {recipe.diet}
          </Badge>
        </div>
        {recipe.description ? (
          <p className="line-clamp-2 text-sm text-muted-foreground">{recipe.description}</p>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <ClockIcon className="size-3.5" aria-hidden="true" />
          {recipe.prepMin + recipe.cookMin} min
        </span>
        <span className="inline-flex items-center gap-1">
          <UtensilsIcon className="size-3.5" aria-hidden="true" />
          {recipe.servings} servings
        </span>
        {recipe.cuisine ? <span>{recipe.cuisine}</span> : null}
      </div>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {recipe.tags.slice(0, 3).map((tag) => (
          <Badge key={tag} variant="outline">
            {tag}
          </Badge>
        ))}
        {recipe.allergens.slice(0, 2).map((allergen) => (
          <Badge key={allergen} variant="destructive" className="capitalize">
            {allergen}
          </Badge>
        ))}
      </div>
    </Link>
  );
}

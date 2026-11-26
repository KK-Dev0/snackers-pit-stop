"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeftIcon, ExternalLinkIcon, Trash2Icon } from "lucide-react";

import { deleteSavedRecipe, getSavedRecipe } from "@/client/db/repos/savedRecipes";
import { EmptyState } from "@/components/common/empty-state";
import { RecipeDetailSkeleton } from "@/components/common/states";
import { PageReveal } from "@/components/motion/page-reveal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { recipeCost } from "@/lib/cost";
import { matchIngredientByName } from "@/lib/ingredient-match";
import { recipeNutrition } from "@/lib/nutrition";
import { IngredientListSchema, RecipeSchema, type Ingredient } from "@/lib/schemas";

/** Reads a device-only import from Dexie and renders it with estimates. */
export function LocalRecipeDetail({ id }: { id: string }) {
  const router = useRouter();
  const [recipe, setRecipe] = useState<ReturnType<typeof RecipeSchema.parse> | null>(null);
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [servings, setServings] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);

  useEffect(() => {
    let active = true;
    void getSavedRecipe(id)
      .then((record) => {
        if (!active) return;
        if (!record) {
          setMissing(true);
          return;
        }
        const parsed = RecipeSchema.safeParse(record.recipe);
        if (!parsed.success) {
          setMissing(true);
          return;
        }
        setRecipe(parsed.data);
        setServings(parsed.data.servings);
      })
      .catch(() => active && setMissing(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [id]);

  useEffect(() => {
    void fetch("/api/ingredients")
      .then((response) => response.json())
      .then((json: unknown) => {
        const parsed = IngredientListSchema.safeParse(
          json && typeof json === "object" && "items" in json ? json.items : json,
        );
        if (parsed.success) setIngredients(parsed.data);
      })
      .catch(() => undefined);
  }, []);

  const resolved = useMemo(() => {
    if (!recipe) return [];
    return (recipe.ingredients ?? []).map((item) => ({
      rawName: item.rawName,
      quantity: item.quantity,
      unit: item.unit,
      optional: item.optional,
      ingredient:
        (item.ingredientId && ingredients.find((i) => i.id === item.ingredientId)) ||
        matchIngredientByName(item.rawName, ingredients),
    }));
  }, [recipe, ingredients]);

  const scale = recipe && servings ? servings / recipe.servings : 1;
  const scaledItems = useMemo(
    () =>
      resolved.map((item) => ({
        ...item,
        quantity: item.quantity * scale,
      })),
    [resolved, scale],
  );

  const nutrition = useMemo(
    () => recipeNutrition(scaledItems, servings ?? recipe?.servings ?? 1),
    [scaledItems, servings, recipe],
  );
  const cost = useMemo(
    () => recipeCost(scaledItems, servings ?? recipe?.servings ?? 1),
    [scaledItems, servings, recipe],
  );
  const matchedCount = resolved.filter((item) => item.ingredient).length;

  return (
    <PageReveal className="mx-auto w-full max-w-3xl space-y-6 px-5 py-8 sm:px-6">
      {loading ? (
        <RecipeDetailSkeleton />
      ) : missing || !recipe ? (
        <EmptyState
          icon={ArrowLeftIcon}
          title="Recipe not found"
          description="This import is no longer on your device. It may have been deleted."
          action={
            <Button asChild variant="outline">
              <Link href="/recipes">Back to recipes</Link>
            </Button>
          }
        />
      ) : (
        <>
          <Button asChild variant="ghost" size="sm" className="-ml-2">
            <Link href="/recipes">
              <ArrowLeftIcon aria-hidden="true" /> Back to recipes
            </Link>
          </Button>

          <header className="space-y-3">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
                  My imports · {recipe.sourceType}
                </p>
                <h1 className="font-display text-3xl font-semibold">{recipe.title}</h1>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${recipe.title}`}
                onClick={() => {
                  if (window.confirm(`Delete “${recipe.title}” from this device?`)) {
                    void deleteSavedRecipe(id).then(() => router.push("/recipes"));
                  }
                }}
              >
                <Trash2Icon />
              </Button>
            </div>
            {recipe.description ? (
              <p className="text-muted-foreground">{recipe.description}</p>
            ) : null}
            <div className="flex flex-wrap gap-2">
              <Badge variant="secondary" className="capitalize">
                {recipe.diet}
              </Badge>
              {recipe.cuisine ? <Badge variant="outline">{recipe.cuisine}</Badge> : null}
              {recipe.allergens.map((allergen) => (
                <Badge key={allergen} variant="destructive" className="capitalize">
                  {allergen}
                </Badge>
              ))}
            </div>
          </header>

          <section
            aria-label="Servings"
            className="flex items-center gap-3 rounded-xl border bg-card p-4"
          >
            <span className="text-sm font-medium">Servings</span>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Decrease servings"
                disabled={(servings ?? 1) <= 1}
                onClick={() => setServings((value) => Math.max(1, (value ?? 1) - 1))}
              >
                −
              </Button>
              <span className="w-8 text-center font-semibold tabular-nums">{servings}</span>
              <Button
                type="button"
                variant="outline"
                size="icon"
                aria-label="Increase servings"
                disabled={(servings ?? 1) >= 20}
                onClick={() => setServings((value) => Math.min(20, (value ?? 1) + 1))}
              >
                +
              </Button>
            </div>
            <span className="ml-auto text-xs text-muted-foreground">Estimates are per serving</span>
          </section>

          <section aria-label="Estimates" className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Energy</p>
              <p className="font-display text-xl font-semibold">{nutrition.kcal} kcal</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Protein</p>
              <p className="font-display text-xl font-semibold">{nutrition.proteinG} g</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Cost / serving</p>
              <p className="font-display text-xl font-semibold">₹{cost.perServing}</p>
            </div>
            <div className="rounded-xl border bg-card p-3">
              <p className="text-xs text-muted-foreground">Time</p>
              <p className="font-display text-xl font-semibold">
                {recipe.prepMin + recipe.cookMin} min
              </p>
            </div>
          </section>
          {matchedCount < resolved.length ? (
            <p className="text-xs text-muted-foreground">
              Estimates cover {matchedCount} of {resolved.length} ingredients — the rest could not
              be matched to the local food catalog. Always check labels.
            </p>
          ) : null}

          <section aria-labelledby="ingredients-heading" className="space-y-2">
            <h2 id="ingredients-heading" className="font-display text-xl font-semibold">
              Ingredients
            </h2>
            <ul className="divide-y rounded-xl border bg-card">
              {resolved.map((item, index) => (
                <li
                  key={`${item.rawName}-${index}`}
                  className="flex items-center justify-between px-4 py-2.5 text-sm"
                >
                  <span>
                    {item.rawName}
                    {item.optional ? (
                      <span className="ml-2 text-xs text-muted-foreground">optional</span>
                    ) : null}
                  </span>
                  <span className="text-muted-foreground tabular-nums">
                    {(item.quantity * scale).toLocaleString(undefined, {
                      maximumFractionDigits: 2,
                    })}{" "}
                    {item.unit}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          {recipe.steps.length > 0 ? (
            <section aria-labelledby="steps-heading" className="space-y-2">
              <h2 id="steps-heading" className="font-display text-xl font-semibold">
                Method
              </h2>
              <ol className="list-decimal space-y-2 pl-5">
                {recipe.steps.map((step, index) => (
                  <li key={index} className="text-sm leading-relaxed">
                    {step}
                  </li>
                ))}
              </ol>
            </section>
          ) : null}

          {recipe.sourceUrl ? (
            <a
              href={recipe.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-primary underline-offset-4 hover:underline"
            >
              View original source <ExternalLinkIcon className="size-3.5" aria-hidden="true" />
            </a>
          ) : null}
        </>
      )}
    </PageReveal>
  );
}

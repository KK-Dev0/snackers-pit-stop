"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRightIcon, SparklesIcon } from "lucide-react";
import { z } from "zod";

import { usePantry } from "@/client/hooks/use-pantry";
import { useProfile } from "@/client/hooks/use-profile";
import { EmptyState } from "@/components/common/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { normalizeIngredientName } from "@/lib/ingredient-match";
import { RecipeSchema, type Recipe } from "@/lib/schemas";

const RecommendResponseSchema = z.object({
  items: z.array(
    z.object({
      recipe: RecipeSchema,
      reasons: z.array(z.string()).default([]),
    }),
  ),
});

type Suggestion = { recipe: Recipe; reasons: string[] };

/** Surfaces catalog recipes that make the best use of what is already at home. */
export function UseItUp() {
  const pantry = usePantry();
  const profile = useProfile();
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  const pantryNames = useMemo(
    () =>
      pantry
        .map((item) => normalizeIngredientName(item.name))
        .filter(Boolean)
        .sort(),
    [pantry],
  );
  const pantryIds = useMemo(
    () =>
      pantry
        .map((item) => item.ingredientId)
        .filter((value): value is string => !!value)
        .sort(),
    [pantry],
  );
  const pantryKey = JSON.stringify([pantryNames, pantryIds]);
  const diet = profile?.diet;
  const allergens = useMemo(() => profile?.allergens ?? [], [profile?.allergens]);
  const dislikes = useMemo(() => profile?.dislikes ?? [], [profile?.dislikes]);

  useEffect(() => {
    if (pantryNames.length === 0) return;
    let active = true;
    void Promise.resolve()
      .then(() => {
        setLoading(true);
        setError(false);
        return fetch("/api/recipes/recommend", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            diet,
            allergens,
            dislikes,
            pantryNames,
            pantryIngredientIds: pantryIds,
            limit: 6,
          }),
        });
      })
      .then(async (response) => {
        if (!response.ok) throw new Error("Recommendation request failed");
        return (await response.json()) as unknown;
      })
      .then((json) => {
        const parsed = RecommendResponseSchema.safeParse(json);
        if (active) setSuggestions(parsed.success ? parsed.data.items : []);
      })
      .catch(() => active && setError(true))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
    // The JSON key is a stable string, so pantry updates refetch without loops.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pantryKey, diet, allergens, dislikes, retryCount]);

  const visibleSuggestions = pantry.length === 0 ? [] : suggestions;

  return (
    <section aria-labelledby="use-it-up-heading" className="space-y-3">
      <div>
        <h2 id="use-it-up-heading" className="font-display text-xl font-semibold">
          Use it up
        </h2>
        <p className="text-sm text-muted-foreground">
          Recipes ranked to make use of what is already in your pantry.
        </p>
      </div>

      <p role="status" aria-live="polite" className="sr-only">
        {error || pantry.length === 0
          ? ""
          : loading
            ? "Finding recipes that use your pantry."
            : `${visibleSuggestions.length} ${visibleSuggestions.length === 1 ? "recipe" : "recipes"} suggested.`}
      </p>

      {pantry.length === 0 ? (
        <EmptyState
          icon={SparklesIcon}
          title="Your pantry unlocks these"
          description="Add a few items above and we will surface recipes that use them first."
        />
      ) : error ? (
        <div role="alert">
          <EmptyState
            icon={SparklesIcon}
            title="Could not load suggestions"
            description="The recommendation service is unavailable right now. Please try again."
            action={
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setError(false);
                  setRetryCount((count) => count + 1);
                }}
              >
                Retry
              </Button>
            }
          />
        </div>
      ) : loading && visibleSuggestions.length === 0 ? (
        <div className="grid gap-3 sm:grid-cols-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : visibleSuggestions.length === 0 ? (
        <EmptyState
          icon={SparklesIcon}
          title="No matches yet"
          description="Try adding a few more everyday ingredients to your pantry."
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {visibleSuggestions.map(({ recipe, reasons }) => (
            <li key={recipe.id}>
              <Link
                href={`/recipes/${recipe.slug}`}
                className="flex h-full flex-col gap-2 rounded-xl border bg-card p-4 transition-shadow hover:shadow-md focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                <span className="flex items-start justify-between gap-2">
                  <span className="font-medium">{recipe.title}</span>
                  <ArrowUpRightIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                </span>
                <span className="text-sm text-muted-foreground">
                  {recipe.prepMin + recipe.cookMin} min · {recipe.cuisine || "Home cooking"}
                </span>
                {reasons.length > 0 ? (
                  <span className="mt-auto flex flex-wrap gap-1.5">
                    {reasons.map((reason) => (
                      <Badge key={reason} variant="secondary" className="font-normal">
                        {reason}
                      </Badge>
                    ))}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

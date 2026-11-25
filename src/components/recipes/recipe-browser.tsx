"use client";

import { useCallback, useEffect, useState } from "react";
import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { RecipeCard } from "@/components/recipes/recipe-card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AllergenSchema,
  DietTypeSchema,
  RecipeSchema,
  type Allergen,
  type DietType,
  type Recipe,
} from "@/lib/schemas";
import type { RecipeSort } from "@/lib/recipe-sort";

const PAGE_SIZE = 12;

type ResponseShape = { items?: unknown[]; total?: number };

export function RecipeBrowser() {
  const [query, setQuery] = useState("");
  const [diet, setDiet] = useState<DietType | "all">("all");
  const [excluded, setExcluded] = useState<Allergen[]>([]);
  const [sort, setSort] = useState<RecipeSort>("recent");
  const [items, setItems] = useState<Recipe[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const load = useCallback(
    async (offset: number, append: boolean) => {
      setLoading(true);
      setError(false);
      const params = new URLSearchParams({ limit: String(PAGE_SIZE), offset: String(offset), sort });
      if (query.trim()) params.set("q", query.trim());
      if (diet !== "all") params.set("diet", diet);
      if (excluded.length) params.set("allergens", excluded.join(","));

      try {
        const response = await fetch(`/api/recipes?${params.toString()}`);
        if (!response.ok) throw new Error("Request failed");
        const json: unknown = await response.json();
        const parsed = RecipeSchema.array().safeParse(
          json && typeof json === "object" && "items" in json ? json.items : [],
        );
        if (!parsed.success) throw new Error("Invalid response");
        const meta = json as ResponseShape;
        setItems((previous) => (append ? [...previous, ...parsed.data] : parsed.data));
        setTotal(meta.total ?? parsed.data.length);
      } catch {
        setError(true);
        if (!append) setItems([]);
      } finally {
        setLoading(false);
      }
    },
    [query, diet, excluded, sort],
  );

  // Reset and refetch when a filter changes (small debounce for the text input).
  useEffect(() => {
    const timer = window.setTimeout(() => void load(0, false), 250);
    return () => window.clearTimeout(timer);
  }, [load]);

  const toggleAllergen = (allergen: Allergen) => {
    setExcluded((previous) =>
      previous.includes(allergen)
        ? previous.filter((value) => value !== allergen)
        : [...previous, allergen],
    );
  };

  return (
    <section aria-labelledby="catalog-heading" className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="catalog-heading" className="font-display text-xl font-semibold">
            Browse recipes
          </h2>
          <p aria-live="polite" className="text-sm text-muted-foreground">
            {loading ? "Loading…" : `${total} ${total === 1 ? "recipe" : "recipes"} found`}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="recipe-sort" className="sr-only">
            Sort recipes
          </Label>
          <Select value={sort} onValueChange={(value) => setSort(value as RecipeSort)}>
            <SelectTrigger id="recipe-sort" className="w-36">
              <SlidersHorizontalIcon className="size-3.5" aria-hidden="true" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Newest</SelectItem>
              <SelectItem value="title">A–Z</SelectItem>
              <SelectItem value="time">Quickest</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <SearchIcon
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={query}
            placeholder="Search recipes, cuisines, tags…"
            aria-label="Search recipes"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="w-full sm:w-40">
          <Label htmlFor="recipe-diet" className="sr-only">
            Diet
          </Label>
          <Select
            value={diet}
            onValueChange={(value) => setDiet(value as DietType | "all")}
          >
            <SelectTrigger id="recipe-diet" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All diets</SelectItem>
              {DietTypeSchema.options.map((option) => (
                <SelectItem key={option} value={option} className="capitalize">
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Exclude allergens</legend>
        <div className="flex flex-wrap gap-2">
          {AllergenSchema.options.map((allergen) => (
            <button
              key={allergen}
              type="button"
              aria-pressed={excluded.includes(allergen)}
              onClick={() => toggleAllergen(allergen)}
              className="rounded-full border px-3 py-1.5 text-sm capitalize aria-pressed:border-destructive aria-pressed:bg-destructive aria-pressed:text-destructive-foreground"
            >
              {allergen}
            </button>
          ))}
        </div>
      </fieldset>

      {error ? (
        <div role="alert">
          <EmptyState
            icon={SearchIcon}
            title="Could not load recipes"
            description="The catalog is unavailable right now. Try again in a moment."
            action={
              <Button type="button" variant="outline" onClick={() => void load(0, false)}>
                Retry
              </Button>
            }
          />
        </div>
      ) : loading && items.length === 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No recipes match"
          description="Try a different search or clear a filter to see more recipes."
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((recipe) => (
              <RecipeCard key={recipe.slug} recipe={recipe} />
            ))}
          </div>
          {loading ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }, (_, index) => (
                <Skeleton key={index} className="h-40 w-full rounded-2xl" />
              ))}
            </div>
          ) : null}
          {items.length < total ? (
            <div className="flex justify-center">
              <Button
                type="button"
                variant="outline"
                disabled={loading}
                onClick={() => void load(items.length, true)}
              >
                {loading ? "Loading…" : "Load more"}
              </Button>
            </div>
          ) : null}
        </>
      )}
    </section>
  );
}

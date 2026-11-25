"use client";

import { useState } from "react";
import { PlusIcon, Trash2Icon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { saveSavedRecipe } from "@/client/db/repos/savedRecipes";
import {
  AllergenSchema,
  DietTypeSchema,
  MealSlotSchema,
  RecipeDraftSchema,
  RecipeSchema,
  UnitSchema,
  type Allergen,
  type DietType,
  type MealSlot,
  type Recipe,
  type RecipeDraft,
  type Unit,
} from "@/lib/schemas";
import { slugify } from "@/lib/slug";

type IngredientRow = {
  key: string;
  rawName: string;
  quantity: string;
  unit: Unit;
  optional: boolean;
};

type EditorState = {
  title: string;
  description: string;
  cuisine: string;
  diet: DietType;
  mealSlots: MealSlot[];
  servings: string;
  prepMin: string;
  cookMin: string;
  sourceUrl: string;
  allergens: Allergen[];
  tags: string;
  ingredients: IngredientRow[];
  stepsText: string;
};

function toEditorState(draft: RecipeDraft): EditorState {
  return {
    title: draft.title,
    description: draft.description,
    cuisine: draft.cuisine,
    diet: draft.diet,
    mealSlots: draft.mealSlots,
    servings: String(draft.servings),
    prepMin: String(draft.prepMin),
    cookMin: String(draft.cookMin),
    sourceUrl: draft.sourceUrl ?? "",
    allergens: draft.allergens,
    tags: draft.tags.join(", "),
    ingredients: draft.ingredients.map((item, index) => ({
      key: `ingredient-${index}`,
      rawName: item.rawName,
      quantity: String(item.quantity),
      unit: item.unit,
      optional: item.optional,
    })),
    stepsText: draft.steps.join("\n"),
  };
}

function parseEditorState(state: EditorState): RecipeDraft | string {
  const sourceUrl = state.sourceUrl.trim();
  if (sourceUrl) {
    try {
      new URL(sourceUrl);
    } catch {
      return "Enter a valid source link or leave it blank.";
    }
  }

  const candidate = {
    title: state.title.trim(),
    description: state.description.trim(),
    cuisine: state.cuisine.trim(),
    diet: state.diet,
    mealSlots: state.mealSlots,
    servings: Number(state.servings),
    prepMin: Number(state.prepMin || 0),
    cookMin: Number(state.cookMin || 0),
    steps: state.stepsText
      .split("\n")
      .map((step) => step.trim())
      .filter(Boolean),
    sourceUrl: sourceUrl || null,
    allergens: state.allergens,
    tags: state.tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean),
    ingredients: state.ingredients.map((row) => ({
      rawName: row.rawName.trim(),
      quantity: Number(row.quantity),
      unit: row.unit,
      optional: row.optional,
    })),
  };

  const result = RecipeDraftSchema.safeParse(candidate);
  if (!result.success) {
    return result.error.issues
      .map((issue) => `${issue.path.join(".") || "form"}: ${issue.message}`)
      .join("; ");
  }
  return result.data;
}

function toggle<T>(values: T[], value: T): T[] {
  return values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];
}

/**
 * Editable review step shown before any imported recipe touches device storage.
 * Nothing is saved until the user explicitly confirms.
 */
export function ImportReviewForm({
  draft,
  sourceType,
  onSaved,
  onCancel,
}: {
  draft: RecipeDraft;
  sourceType: "url" | "photo" | "llm";
  onSaved?: (id: string) => void;
  onCancel?: () => void;
}) {
  const [state, setState] = useState<EditorState>(() => toEditorState(draft));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const update = <K extends keyof EditorState>(key: K, value: EditorState[K]) => {
    setState((previous) => ({ ...previous, [key]: value }));
  };

  const updateIngredient = (key: string, patch: Partial<IngredientRow>) => {
    setState((previous) => ({
      ...previous,
      ingredients: previous.ingredients.map((row) =>
        row.key === key ? { ...row, ...patch } : row,
      ),
    }));
  };

  const save = async () => {
    const parsed = parseEditorState(state);
    if (typeof parsed === "string") {
      setError(parsed);
      return;
    }

    const now = Date.now();
    const id = crypto.randomUUID();
    const recipe: Recipe = {
      id,
      slug: `${slugify(parsed.title)}-${id.slice(0, 6)}`,
      title: parsed.title,
      description: parsed.description,
      cuisine: parsed.cuisine,
      diet: parsed.diet,
      mealSlots: parsed.mealSlots,
      servings: parsed.servings,
      prepMin: parsed.prepMin,
      cookMin: parsed.cookMin,
      steps: parsed.steps,
      sourceUrl: parsed.sourceUrl,
      sourceType,
      allergens: parsed.allergens,
      tags: parsed.tags,
      ingredients: parsed.ingredients.map((item, index) => ({
        rawName: item.rawName,
        ingredientId: item.ingredientId ?? null,
        quantity: item.quantity,
        unit: item.unit,
        grams: item.grams ?? null,
        optional: item.optional,
        sortOrder: index,
      })),
      createdAt: now,
    };
    const validated = RecipeSchema.safeParse(recipe);
    if (!validated.success) {
      setError("Check the highlighted fields before saving.");
      return;
    }

    setSaving(true);
    try {
      await saveSavedRecipe({
        id,
        slug: recipe.slug,
        recipe: validated.data,
        sourceUrl: parsed.sourceUrl,
        sourceType,
        importedAt: now,
      });
      setError(null);
      onSaved?.(id);
    } catch {
      setError("Could not save this recipe on your device.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section aria-labelledby="review-heading" className="space-y-5 rounded-2xl border bg-card p-5">
      <div>
        <h2 id="review-heading" className="font-display text-xl font-semibold">
          Review before saving
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Check what was extracted — nothing is stored until you save. Allergen and diet hints are
          best-effort; always check labels.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="review-title">Title</Label>
          <Input
            id="review-title"
            value={state.title}
            onChange={(event) => update("title", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-servings">Servings</Label>
          <Input
            id="review-servings"
            type="number"
            min={1}
            max={20}
            value={state.servings}
            onChange={(event) => update("servings", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-cuisine">Cuisine</Label>
          <Input
            id="review-cuisine"
            value={state.cuisine}
            onChange={(event) => update("cuisine", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-diet">Diet</Label>
          <Select
            value={state.diet}
            onValueChange={(value) => update("diet", value as DietType)}
          >
            <SelectTrigger id="review-diet" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {DietTypeSchema.options.map((diet) => (
                <SelectItem key={diet} value={diet}>
                  {diet}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-prep">Prep minutes</Label>
          <Input
            id="review-prep"
            type="number"
            min={0}
            value={state.prepMin}
            onChange={(event) => update("prepMin", event.target.value)}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="review-cook">Cook minutes</Label>
          <Input
            id="review-cook"
            type="number"
            min={0}
            value={state.cookMin}
            onChange={(event) => update("cookMin", event.target.value)}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-description">Description</Label>
        <Textarea
          id="review-description"
          value={state.description}
          onChange={(event) => update("description", event.target.value)}
        />
      </div>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Meal slots</legend>
        <div className="flex flex-wrap gap-2">
          {MealSlotSchema.options.map((slot) => (
            <button
              key={slot}
              type="button"
              aria-pressed={state.mealSlots.includes(slot)}
              onClick={() => update("mealSlots", toggle(state.mealSlots, slot))}
              className="rounded-full border px-3 py-1.5 text-sm capitalize aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {slot}
            </button>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">Allergen hints</legend>
        <div className="flex flex-wrap gap-2">
          {AllergenSchema.options.map((allergen) => (
            <button
              key={allergen}
              type="button"
              aria-pressed={state.allergens.includes(allergen)}
              onClick={() => update("allergens", toggle(state.allergens, allergen))}
              className="rounded-full border px-3 py-1.5 text-sm capitalize aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground"
            >
              {allergen}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="review-tags">Tags (comma separated)</Label>
        <Input
          id="review-tags"
          value={state.tags}
          onChange={(event) => update("tags", event.target.value)}
        />
      </div>

      <div className="space-y-3">
        <h3 className="text-sm font-medium">Ingredients</h3>
        {state.ingredients.map((row, index) => (
          <div key={row.key} className="grid grid-cols-[1fr_5rem_6rem_auto_auto] gap-2">
            <Input
              aria-label={`Ingredient ${index + 1} name`}
              placeholder="Ingredient"
              value={row.rawName}
              onChange={(event) => updateIngredient(row.key, { rawName: event.target.value })}
            />
            <Input
              aria-label={`Ingredient ${index + 1} quantity`}
              type="number"
              min={0}
              step="any"
              value={row.quantity}
              onChange={(event) => updateIngredient(row.key, { quantity: event.target.value })}
            />
            <Select
              value={row.unit}
              onValueChange={(value) => updateIngredient(row.key, { unit: value as Unit })}
            >
              <SelectTrigger aria-label={`Ingredient ${index + 1} unit`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {UnitSchema.options.map((unit) => (
                  <SelectItem key={unit} value={unit}>
                    {unit}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <label className="flex items-center gap-1.5 text-sm">
              <Checkbox
                checked={row.optional}
                onCheckedChange={(checked) =>
                  updateIngredient(row.key, { optional: checked === true })
                }
                aria-label={`Ingredient ${index + 1}${row.rawName ? ` (${row.rawName})` : ""} is optional`}
              />
              Optional
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label={`Remove ingredient ${index + 1}${row.rawName ? ` (${row.rawName})` : ""}`}
              onClick={() =>
                update(
                  "ingredients",
                  state.ingredients.filter((item) => item.key !== row.key),
                )
              }
            >
              <Trash2Icon />
            </Button>
          </div>
        ))}
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() =>
            update("ingredients", [
              ...state.ingredients,
              {
                key: `ingredient-${Date.now()}`,
                rawName: "",
                quantity: "1",
                unit: "piece",
                optional: false,
              },
            ])
          }
        >
          <PlusIcon aria-hidden="true" /> Add ingredient
        </Button>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-steps">Steps (one per line)</Label>
        <Textarea
          id="review-steps"
          value={state.stepsText}
          onChange={(event) => update("stepsText", event.target.value)}
          rows={5}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="review-source">Source link</Label>
        <Input
          id="review-source"
          type="url"
          value={state.sourceUrl}
          placeholder="https://…"
          onChange={(event) => update("sourceUrl", event.target.value)}
        />
      </div>

      {error ? (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={() => void save()} disabled={saving}>
          {saving ? "Saving…" : "Save recipe"}
        </Button>
        {onCancel ? (
          <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
            Discard
          </Button>
        ) : null}
      </div>
    </section>
  );
}

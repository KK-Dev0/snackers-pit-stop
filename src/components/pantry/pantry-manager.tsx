"use client";

import { useEffect, useMemo, useState } from "react";
import { PencilIcon, PlusIcon, SearchIcon, Trash2Icon } from "lucide-react";

import { deletePantryItem, savePantryItem } from "@/client/db/repos/pantry";
import { usePantry } from "@/client/hooks/use-pantry";
import { EmptyState } from "@/components/common/empty-state";
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
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { normalizeIngredientName } from "@/lib/ingredient-match";
import {
  IngredientListSchema,
  PantryItemSchema,
  UnitSchema,
  type Ingredient,
  type PantryItem,
  type Unit,
} from "@/lib/schemas";

type FormState = {
  id?: string;
  ingredientId?: string;
  name: string;
  quantity: string;
  unit: Unit;
  isStaple: boolean;
};

const EMPTY_FORM: FormState = {
  name: "",
  quantity: "1",
  unit: "piece",
  isStaple: false,
};

type SortOption = "name" | "recent" | "staples";

function pantryItemFromIngredient(ingredient: Ingredient) {
  const now = Date.now();
  return PantryItemSchema.safeParse({
    id: crypto.randomUUID(),
    ingredientId: ingredient.id,
    name: ingredient.name,
    normalizedName: normalizeIngredientName(ingredient.name),
    quantity: 1,
    unit: ingredient.baseUnit,
    isStaple: ingredient.isStaple,
    createdAt: now,
    updatedAt: now,
  });
}

/** Add, edit, find and delete the items on the device pantry. */
export function PantryManager() {
  const items = usePantry();
  const [ingredients, setIngredients] = useState<Ingredient[]>([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("recent");
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    void fetch("/api/ingredients")
      .then((response) => response.json())
      .then((json: unknown) => {
        const parsed = IngredientListSchema.safeParse(
          json && typeof json === "object" && "items" in json ? json.items : json,
        );
        if (active && parsed.success) setIngredients(parsed.data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, []);

  const close = () => {
    setForm(null);
    setError(null);
  };

  const openAdd = () => setForm({ ...EMPTY_FORM });

  const openEdit = (item: PantryItem) => {
    setForm({
      id: item.id,
      ingredientId: item.ingredientId,
      name: item.name,
      quantity: String(item.quantity),
      unit: item.unit,
      isStaple: item.isStaple,
    });
    setError(null);
  };

  const submit = async () => {
    if (!form) return;
    const name = form.name.trim();
    const quantity = Number(form.quantity);
    const now = Date.now();
    const parsed = PantryItemSchema.safeParse({
      id: form.id ?? crypto.randomUUID(),
      ingredientId: form.ingredientId,
      name,
      normalizedName: normalizeIngredientName(name),
      quantity,
      unit: form.unit,
      isStaple: form.isStaple,
      createdAt: items.find((item) => item.id === form.id)?.createdAt ?? now,
      updatedAt: now,
    });
    if (!parsed.success) {
      setError("Enter a name and a quantity greater than zero.");
      return;
    }
    await savePantryItem(parsed.data);
    close();
  };

  const remove = async (item: PantryItem) => {
    await deletePantryItem(item.id);
  };

  const quickAdd = async (ingredient: Ingredient) => {
    const parsed = pantryItemFromIngredient(ingredient);
    if (parsed.success) await savePantryItem(parsed.data);
  };

  const needle = normalizeIngredientName(query);
  const visibleItems = useMemo(() => {
    const filtered = needle
      ? items.filter((item) => normalizeIngredientName(item.name).includes(needle))
      : [...items];
    if (sort === "name") {
      return filtered.sort((a, b) => a.name.localeCompare(b.name));
    }
    if (sort === "staples") {
      return filtered.sort(
        (a, b) => Number(b.isStaple) - Number(a.isStaple) || a.name.localeCompare(b.name),
      );
    }
    return filtered.sort((a, b) => b.createdAt - a.createdAt);
  }, [items, needle, sort]);

  const suggestions = useMemo(() => {
    const owned = new Set(
      items.flatMap((item) => [
        item.ingredientId ?? "",
        normalizeIngredientName(item.name),
      ]),
    );
    return ingredients
      .filter(
        (ingredient) =>
          !owned.has(ingredient.id) &&
          !owned.has(normalizeIngredientName(ingredient.name)) &&
          (!needle || normalizeIngredientName(ingredient.name).includes(needle)),
      )
      .sort((a, b) => a.name.localeCompare(b.name))
      .slice(0, 8);
  }, [ingredients, items, needle]);

  return (
    <section aria-labelledby="pantry-items-heading" className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id="pantry-items-heading" className="font-display text-xl font-semibold">
            On the shelf
          </h2>
          <p className="text-sm text-muted-foreground">
            {items.length} {items.length === 1 ? "item" : "items"} saved on this device
          </p>
        </div>
        <Button type="button" onClick={openAdd}>
          <PlusIcon aria-hidden="true" /> Add item
        </Button>
      </div>

      <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
        <div className="relative">
          <SearchIcon
            className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            id="pantry-search"
            name="pantrySearch"
            type="search"
            value={query}
            placeholder="Search your pantry"
            aria-label="Search pantry items"
            className="pl-9"
            onChange={(event) => setQuery(event.target.value)}
          />
        </div>
        <div className="sm:w-36">
          <Label htmlFor="pantry-sort" className="sr-only">
            Sort pantry items
          </Label>
          <Select
            name="pantrySort"
            value={sort}
            onValueChange={(value) => setSort(value as SortOption)}
          >
            <SelectTrigger id="pantry-sort">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="recent">Recently added</SelectItem>
              <SelectItem value="name">Name A–Z</SelectItem>
              <SelectItem value="staples">Staples first</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {suggestions.length > 0 ? (
        <div className="rounded-2xl border border-dashed bg-card/60 p-3">
          <p className="mb-2 text-sm font-medium">
            {needle ? "Matching ingredients" : "Quick add from the catalog"}
          </p>
          <div className="flex flex-wrap gap-2">
            {suggestions.map((ingredient) => (
              <Button
                key={ingredient.id}
                type="button"
                variant="outline"
                size="sm"
                aria-label={`Add ${ingredient.name} to pantry`}
                onClick={() => void quickAdd(ingredient)}
              >
                <PlusIcon aria-hidden="true" /> {ingredient.name}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {items.length === 0 ? (
        <EmptyState
          icon={PlusIcon}
          title="Nothing in the pantry yet"
          description="Add staples and leftovers to get recipes that use them up first."
          action={
            <Button type="button" variant="outline" onClick={openAdd}>
              Add your first item
            </Button>
          }
        />
      ) : visibleItems.length === 0 ? (
        <EmptyState
          icon={SearchIcon}
          title="No matching items"
          description="Try a different search term, or add the item manually."
        />
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {visibleItems.map((item) => (
            <li key={item.id} className="flex items-center gap-3 px-4 py-3">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.name}</p>
                <p className="text-sm text-muted-foreground tabular-nums">
                  {item.quantity} {item.unit}
                  {item.isStaple ? " · staple" : ""}
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Edit ${item.name}`}
                onClick={() => openEdit(item)}
              >
                <PencilIcon aria-hidden="true" />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label={`Delete ${item.name}`}
                onClick={() => void remove(item)}
              >
                <Trash2Icon aria-hidden="true" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      <Sheet open={!!form} onOpenChange={(open) => !open && close()}>
        <SheetContent side="bottom">
          <SheetHeader>
            <SheetTitle>{form?.id ? "Edit pantry item" : "Add pantry item"}</SheetTitle>
            <SheetDescription>
              Rough quantities are enough. Everything stays on this device.
            </SheetDescription>
          </SheetHeader>
          {form ? (
            <form
              className="space-y-4"
              onSubmit={(event) => {
                event.preventDefault();
                void submit();
              }}
            >
              <div className="space-y-1.5">
                <Label htmlFor="pantry-name">Item name</Label>
                <Input
                  id="pantry-name"
                  name="pantryItemName"
                  value={form.name}
                  autoComplete="off"
                  placeholder="e.g. toor dal"
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="pantry-quantity">Quantity</Label>
                  <Input
                    id="pantry-quantity"
                    name="pantryQuantity"
                    type="number"
                    min="0.01"
                    step="any"
                    inputMode="decimal"
                    value={form.quantity}
                    onChange={(event) => setForm({ ...form, quantity: event.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="pantry-unit">Unit</Label>
                  <Select
                    name="pantryUnit"
                    value={form.unit}
                    onValueChange={(value) => setForm({ ...form, unit: value as Unit })}
                  >
                    <SelectTrigger id="pantry-unit">
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
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="pantry-staple"
                  name="pantryStaple"
                  checked={form.isStaple}
                  onCheckedChange={(checked) =>
                    setForm({ ...form, isStaple: checked === true })
                  }
                />
                <Label htmlFor="pantry-staple" className="font-normal">
                  Treat as a staple (assumed on hand)
                </Label>
              </div>
              {error ? (
                <p role="alert" className="text-sm text-destructive">
                  {error}
                </p>
              ) : null}
              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={close}>
                  Cancel
                </Button>
                <Button type="submit">Save item</Button>
              </div>
            </form>
          ) : null}
        </SheetContent>
      </Sheet>
    </section>
  );
}

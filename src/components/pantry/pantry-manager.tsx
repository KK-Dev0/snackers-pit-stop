"use client";

import { useState } from "react";
import { PencilIcon, PlusIcon, Trash2Icon } from "lucide-react";

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
import { PantryItemSchema, UnitSchema, type PantryItem, type Unit } from "@/lib/schemas";

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

/** Add, edit and delete the items on the device pantry. */
export function PantryManager() {
  const items = usePantry();
  const [form, setForm] = useState<FormState | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      ) : (
        <ul className="divide-y rounded-2xl border bg-card">
          {items.map((item) => (
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

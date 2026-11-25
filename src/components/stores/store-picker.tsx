"use client";

import { useState } from "react";

import { useUserStores } from "@/client/hooks/use-user-stores";
import { AvailabilityToggle } from "@/components/stores/availability-toggle";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { orderStores } from "@/lib/store-selection";
import type { StoreWithAvailability } from "@/lib/schemas";

const LOCAL_KIRANA_ID = "local-kirana";

type StorePickerProps = {
  pincode: string;
  stores: StoreWithAvailability[];
  hasAvailabilityData?: boolean;
  selectedIds?: string[];
  onChange?: (storeIds: string[], customName?: string) => void;
  onCustomNameChange?: (name: string) => void;
};

/**
 * Store choice lives on the device and always wins over crowdsourced counts.
 * Every seeded store stays visible, even for a pincode with no data yet.
 */
export function StorePicker({
  pincode,
  stores,
  hasAvailabilityData = false,
  selectedIds = [],
  onChange,
  onCustomNameChange,
}: StorePickerProps) {
  const { records, setSelected, setCustomName } = useUserStores();
  const ordered = orderStores(stores, records, selectedIds);
  const savedCustomName =
    records.find((record) => record.storeId === LOCAL_KIRANA_ID)?.customName ?? "";
  // `null` means "no local edit yet"; an empty string is a deliberate clearing.
  const [draftCustomName, setLocalCustomName] = useState<string | null>(null);
  const customName = draftCustomName ?? savedCustomName;

  const nextIds = (storeId: string, selected: boolean) =>
    selected
      ? Array.from(new Set([...selectedIds, storeId]))
      : selectedIds.filter((id) => id !== storeId);

  const handleToggle = (storeId: string, selected: boolean) => {
    void setSelected(storeId, selected);
    onChange?.(nextIds(storeId, selected), customName || undefined);
  };

  const handleCustomName = (name: string) => {
    setLocalCustomName(name);
    void setCustomName(LOCAL_KIRANA_ID, name.trim());
    onCustomNameChange?.(name.trim());
    onChange?.(selectedIds, name.trim() || undefined);
  };

  return (
    <div className="space-y-3">
      <div>
        <p className="font-medium">Stores near {pincode}</p>
        <p className="text-xs text-muted-foreground">
          Availability is crowdsourced. Your own picks always win.
        </p>
      </div>

      {!hasAvailabilityData && (
        <p role="status" className="rounded-lg border border-dashed bg-muted/50 p-3 text-sm">
          We are still crowdsourcing availability for {pincode}. All stores are shown
          as unconfirmed — pick the ones you actually use.
        </p>
      )}

      <ul className="space-y-2">
        {ordered.map((store) => (
          <li
            key={store.id}
            className="flex flex-col gap-3 rounded-lg border bg-card p-3 sm:flex-row sm:items-center sm:justify-between"
          >
            <div className="space-y-1">
              <p className="font-medium">{store.displayName}</p>
              <Badge variant={store.confirmed ? "default" : "secondary"}>
                {store.confirmed
                  ? `Confirmed by ${store.confirmedCount} ${store.confirmedCount === 1 ? "person" : "people"}`
                  : "Unconfirmed here"}
              </Badge>
            </div>
            <AvailabilityToggle
              storeId={store.id}
              checked={store.selected}
              onChange={(checked) => handleToggle(store.id, checked)}
            />
          </li>
        ))}
      </ul>

      {ordered.some((store) => store.id === LOCAL_KIRANA_ID && store.selected) && (
        <div className="space-y-1">
          <Label htmlFor="custom-kirana-name">Name your local kirana (optional)</Label>
          <Input
            id="custom-kirana-name"
            value={customName}
            placeholder="Other local kirana"
            onChange={(event) => handleCustomName(event.target.value)}
          />
        </div>
      )}
    </div>
  );
}

"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** The crowdsourcing question shown next to every store. */
export function AvailabilityToggle({
  storeId,
  checked,
  onChange,
}: {
  storeId: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = `store-selected-${storeId}`;
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label="Do you use this here?"
      />
      <Label htmlFor={id} className="font-normal">
        Do you use this here?
      </Label>
    </div>
  );
}

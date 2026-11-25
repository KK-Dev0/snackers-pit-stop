"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

/** The crowdsourcing question shown next to every store. */
export function AvailabilityToggle({
  storeId,
  storeName,
  checked,
  onChange,
}: {
  storeId: string;
  storeName: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  const id = `store-selected-${storeId}`;
  const question = `Do you use ${storeName} here?`;
  return (
    <div className="flex items-center gap-2">
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onChange}
        aria-label={question}
      />
      <Label htmlFor={id} className="font-normal">
        {question}
      </Label>
    </div>
  );
}

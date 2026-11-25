"use client";

import type { ReactNode } from "react";
import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { groupByAisle, moveShoppingItem } from "@/lib/shopping-list";
import type { ShoppingItem } from "@/lib/schemas";

/**
 * Collapsible aisle sections with keyboard-accessible reorder controls.
 * The parent owns the item array so a saved order survives list regeneration.
 */
export function AisleSections({
  items,
  savedOrder = [],
  renderItem,
  onMove,
}: {
  items: ShoppingItem[];
  savedOrder?: string[];
  renderItem?: (item: ShoppingItem) => ReactNode;
  onMove?: (next: ShoppingItem[]) => void;
}) {
  const groups = groupByAisle(items, savedOrder);

  return (
    <div className="space-y-3">
      {groups.map((group) => (
        <details key={group.aisle} open className="rounded-xl border bg-card">
          <summary className="flex cursor-pointer items-center justify-between gap-2 rounded-xl px-4 py-3 font-medium focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none">
            <span>{group.label}</span>
            <span className="text-sm text-muted-foreground tabular-nums">{group.items.length}</span>
          </summary>
          <ul className="divide-y border-t">
            {group.items.map((item) => (
              <li key={item.key} className="flex items-center gap-2 px-2 py-2 sm:px-4">
                <div className="min-w-0 flex-1">
                  {renderItem ? (
                    renderItem(item)
                  ) : (
                    <p className="text-sm">
                      <span className="font-medium">{item.name}</span>{" "}
                      <span className="text-muted-foreground tabular-nums">
                        {item.quantity} {item.unit}
                      </span>
                    </p>
                  )}
                </div>
                {onMove ? (
                  <div className="flex shrink-0">
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${item.name} up`}
                      onClick={() => onMove(moveShoppingItem(items, item.key, -1))}
                    >
                      <ChevronUpIcon aria-hidden="true" />
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Move ${item.name} down`}
                      onClick={() => onMove(moveShoppingItem(items, item.key, 1))}
                    >
                      <ChevronDownIcon aria-hidden="true" />
                    </Button>
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}

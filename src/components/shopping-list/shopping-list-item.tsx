"use client";

import { motion } from "framer-motion";
import { CheckIcon } from "lucide-react";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";
import type { ShoppingItem } from "@/lib/schemas";

/** A quick, satisfying check-off with a drawn strike-through. */
export function ShoppingListItem({
  item,
  onToggle,
}: {
  item: ShoppingItem;
  onToggle: (key: string) => void;
}) {
  const reduceMotion = useReducedMotion();
  const duration = reduceMotion ? 0 : motionTokens.duration.fast;

  return (
    <div className="flex items-start gap-3 py-0.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={item.checked}
        aria-label={`${item.checked ? "Uncheck" : "Check off"} ${item.name}`}
        onClick={() => onToggle(item.key)}
        className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md border border-border transition-colors hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground"
      >
        <motion.span
          aria-hidden="true"
          initial={false}
          animate={{ scale: item.checked ? 1 : 0.5, opacity: item.checked ? 1 : 0 }}
          transition={{ duration }}
        >
          <CheckIcon className="size-4" />
        </motion.span>
      </button>
      <div className="min-w-0 flex-1">
        <span className="relative inline-block max-w-full text-sm">
          <span className={item.checked ? "text-muted-foreground" : "font-medium"}>
            {item.name}
          </span>
          <motion.span
            aria-hidden="true"
            className="absolute top-1/2 left-0 h-px w-full origin-left bg-current"
            initial={false}
            animate={{ scaleX: item.checked ? 1 : 0, opacity: item.checked ? 0.7 : 0 }}
            transition={{ duration }}
          />
        </span>
        <span className="ml-2 text-sm text-muted-foreground tabular-nums">
          {item.quantity} {item.unit}
          {item.estimatedCostInr === undefined ? "" : ` · ₹${item.estimatedCostInr}`}
        </span>
      </div>
    </div>
  );
}

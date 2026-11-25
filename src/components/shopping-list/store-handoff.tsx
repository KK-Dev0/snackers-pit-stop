"use client";

import { useState } from "react";
import { CopyIcon, ExternalLinkIcon, StoreIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ShoppingItem, Store } from "@/lib/schemas";
import { handoffText, storeLinksForQuery } from "@/lib/store-links";

/** Open a store search for one item or the whole list, with a copy fallback. */
export function StoreHandoff({
  stores,
  query,
  items,
  savedOrder = [],
  label = "Shop at",
  compact = false,
}: {
  stores: Store[];
  query: string;
  items: ShoppingItem[];
  savedOrder?: string[];
  label?: string;
  compact?: boolean;
}) {
  const [message, setMessage] = useState("");
  const links = storeLinksForQuery(stores, query);

  const copy = async (store: Store) => {
    const text = handoffText(store, items, savedOrder);
    try {
      await navigator.clipboard.writeText(text);
      setMessage(`Copied for ${store.name}.`);
    } catch {
      setMessage(`Could not copy for ${store.name}.`);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant={compact ? "ghost" : "outline"}
          size={compact ? "icon-sm" : "sm"}
          aria-label={`${label} ${query}`}
        >
          <StoreIcon aria-hidden="true" />
          {compact ? null : label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>{label} “{query}”</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {links.map(({ store, url }) => (
          <DropdownMenuItem key={store.id} asChild>
            <a href={url} target="_blank" rel="noopener noreferrer">
              <ExternalLinkIcon aria-hidden="true" />
              {store.name}
            </a>
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        {stores.map((store) => (
          <DropdownMenuItem key={`copy-${store.id}`} onSelect={() => void copy(store)}>
            <CopyIcon aria-hidden="true" />
            Copy list for {store.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
      <span aria-live="polite" className="sr-only">
        {message}
      </span>
    </DropdownMenu>
  );
}

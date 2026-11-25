"use client";

import { WifiOffIcon } from "lucide-react";
import { useEffect, useState } from "react";

/** Visible across the app (and landing page) while the browser has no connection. */
export function OfflineBanner() {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[70] flex items-center justify-center gap-2 border-b border-border bg-accent px-4 py-2 text-center text-xs font-medium text-accent-foreground shadow-soft"
    >
      <WifiOffIcon className="size-4 shrink-0" aria-hidden="true" />
      <span>
        Offline — your plan, pantry and list still work. Imports and store votes need a connection.
      </span>
    </div>
  );
}

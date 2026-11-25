"use client";

import { useEffect, useState } from "react";

import { isPincode } from "@/lib/geo";
import { StoresResponseSchema, type StoreWithAvailability } from "@/lib/schemas";

type StoresState = {
  items: StoreWithAvailability[];
  hasAvailabilityData: boolean;
  loading: boolean;
  error: string | null;
};

const INITIAL: StoresState = {
  items: [],
  hasAvailabilityData: false,
  loading: false,
  error: null,
};

/** Server catalog plus crowdsourced availability for one pincode (optional). */
export function useStores(pincode?: string | null): StoresState {
  const [state, setState] = useState<StoresState>(INITIAL);

  useEffect(() => {
    if (pincode && !isPincode(pincode)) return;

    const controller = new AbortController();
    const query = pincode ? `?pincode=${encodeURIComponent(pincode)}` : "";

    // Defer the pending state so React can paint before the spinner appears.
    void Promise.resolve().then(() => {
      if (!controller.signal.aborted) setState({ ...INITIAL, loading: true });
    });

    fetch(`/api/stores${query}`, { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load stores.");
        return StoresResponseSchema.safeParse(await response.json());
      })
      .then((parsed) => {
        if (controller.signal.aborted) return;
        if (!parsed.success) {
          setState({ ...INITIAL, error: "Could not load stores." });
          return;
        }
        setState({
          items: parsed.data.items,
          hasAvailabilityData: parsed.data.hasAvailabilityData,
          loading: false,
          error: null,
        });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted) return;
        setState({
          ...INITIAL,
          error: error instanceof Error ? error.message : "Could not load stores.",
        });
      });

    return () => controller.abort();
  }, [pincode]);

  return state;
}

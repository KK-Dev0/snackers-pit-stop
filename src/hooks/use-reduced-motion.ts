"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

import { useMounted } from "@/hooks/use-mounted";

/**
 * True when the user asked for reduced motion. Components use it to swap
 * transforms for plain opacity (or no animation at all).
 */
export function useReducedMotion() {
  const mounted = useMounted();
  const preference = useFramerReducedMotion() ?? false;
  // framer-motion can read the media query during the first client render,
  // which would disagree with the server-rendered markup. Wait for hydration
  // before letting the preference change conditional rendering.
  return mounted && preference;
}

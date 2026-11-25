"use client";

import { useReducedMotion as useFramerReducedMotion } from "framer-motion";

/**
 * True when the user asked for reduced motion. Components use it to swap
 * transforms for plain opacity (or no animation at all).
 */
export function useReducedMotion() {
  return useFramerReducedMotion() ?? false;
}

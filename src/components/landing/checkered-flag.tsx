"use client";

import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";

/**
 * The recurring pit-stop motif: a small checkered flag on a short pole. It
 * sways gently on the landing page only; reduced motion keeps it still.
 */
export function CheckeredFlag({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <span aria-hidden="true" className={`inline-flex items-start ${className ?? ""}`}>
      <span className="h-7 w-px rounded-full bg-foreground/40" />
      <motion.span
        className="checkered-flag -ml-px h-4 w-7 origin-left rounded-[3px] shadow-soft"
        animate={reduceMotion ? undefined : { rotate: [0, -3, 1.5, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
      />
    </span>
  );
}

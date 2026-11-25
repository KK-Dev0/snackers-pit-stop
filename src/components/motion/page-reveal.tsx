"use client";

import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, revealTransition } from "@/lib/motion";

/**
 * Fades and lifts a screen's content in on mount. Used at the top of each app
 * screen; the delay stays small so the interface feels immediate.
 */
export function PageReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: motionTokens.distance.reveal }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ ...revealTransition, delay }}
    >
      {children}
    </motion.div>
  );
}

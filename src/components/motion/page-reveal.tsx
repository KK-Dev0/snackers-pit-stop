"use client";

import { motion } from "framer-motion";

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
  // MotionConfig's "user" mode drops the lift for reduced-motion users while
  // keeping the fade, and renders the same tree on server and client.
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

"use client";

import { motion, type Variants } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, revealTransition } from "@/lib/motion";

const itemVariants: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.reveal },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};

/**
 * Reveals children one after another with a 40 ms gap. Wrap each child in
 * `StaggerItem`; children outside the list still render, just unanimated.
 */
export function StaggerList({
  children,
  className,
  stagger = motionTokens.stagger.base,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: { transition: { staggerChildren: stagger } },
      }}
    >
      {children}
    </motion.div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div className={className} variants={itemVariants}>
      {children}
    </motion.div>
  );
}

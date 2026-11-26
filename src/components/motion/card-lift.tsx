"use client";

import { motion } from "framer-motion";

import { motionTokens } from "@/lib/motion";

/**
 * Small hover lift for cards and tiles. Pointer-only by design: touch devices
 * keep the flat state, and reduced motion removes the transform entirely.
 */
export function CardLift({
  children,
  className,
  lift = motionTokens.distance.lift,
}: {
  children: React.ReactNode;
  className?: string;
  lift?: number;
}) {
  return (
    <motion.div
      className={className}
      whileHover={{ y: -lift }}
      whileFocus={{ y: -lift }}
      transition={{ duration: motionTokens.duration.fast, ease: [...motionTokens.ease] }}
    >
      {children}
    </motion.div>
  );
}

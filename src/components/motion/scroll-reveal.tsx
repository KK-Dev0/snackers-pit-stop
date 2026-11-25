"use client";

import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens } from "@/lib/motion";

/**
 * Reveals content once it scrolls into view. Landing-page only: app screens
 * use `PageReveal` and stay under 400 ms.
 */
export function ScrollReveal({
  children,
  className,
  delay = 0,
  distance = 16,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
  distance?: number;
}) {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: distance }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-10% 0px" }}
      transition={{
        duration: motionTokens.duration.landing,
        ease: [...motionTokens.ease],
        delay,
      }}
    >
      {children}
    </motion.div>
  );
}

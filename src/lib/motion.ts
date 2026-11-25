import type { Transition, Variants } from "framer-motion";

/**
 * Shared motion tokens. App screens stay at or under 400 ms; the landing page
 * may stretch to 600 ms. Reduced motion is handled per component, never by
 * shortening durations alone.
 */
export const motionTokens = {
  /** Fast, confident ease-out. */
  ease: [0.22, 1, 0.36, 1] as const,
  duration: {
    fast: 0.18,
    base: 0.32,
    slow: 0.45,
    landing: 0.6,
  },
  stagger: {
    fast: 0.04,
    base: 0.06,
    slow: 0.08,
  },
  distance: {
    reveal: 8,
    lift: 3,
  },
} as const;

export const revealTransition: Transition = {
  duration: motionTokens.duration.base,
  ease: [...motionTokens.ease],
};

export const revealVariants: Variants = {
  hidden: { opacity: 0, y: motionTokens.distance.reveal },
  visible: { opacity: 1, y: 0, transition: revealTransition },
};

export const staggerContainer: Variants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: motionTokens.stagger.base,
      delayChildren: motionTokens.stagger.fast,
    },
  },
};

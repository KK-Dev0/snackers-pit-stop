"use client";

import { useId } from "react";
import { motion } from "framer-motion";

import { useReducedMotion } from "@/hooks/use-reduced-motion";
import { motionTokens, revealTransition } from "@/lib/motion";

const ARC_RADIUS = 78;

/**
 * Fuel-gauge meter: a semicircle that fills with the budget used. The value is
 * also exposed as an accessible meter so the graphic is never the only source.
 */
export function FuelGauge({
  value,
  max,
  label,
  className,
}: {
  value: number;
  max: number;
  label: string;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  const gradientId = useId();
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const overBudget = max > 0 && value > max;
  const durationMs = Math.round(motionTokens.duration.base * 1000);
  const arcTransition = {
    ...revealTransition,
    duration: reduceMotion ? 0 : motionTokens.duration.base,
  };

  return (
    <div className={className}>
      <svg
        viewBox="0 0 200 124"
        className="w-full"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-valuenow={Math.round(value)}
        aria-valuetext={`${Math.round(value)} of ${Math.round(max)} rupees`}
      >
        <defs>
          <linearGradient id={gradientId} x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="var(--accent)" />
            <stop offset="100%" stopColor={overBudget ? "var(--destructive)" : "var(--primary)"} />
          </linearGradient>
        </defs>

        {/* Track */}
        <path
          d={`M ${100 - ARC_RADIUS} 100 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${100 + ARC_RADIUS} 100`}
          fill="none"
          stroke="var(--border)"
          strokeWidth="10"
          strokeLinecap="round"
        />

        {/* Filled portion, drawn by normalised path length. */}
        <motion.path
          d={`M ${100 - ARC_RADIUS} 100 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${100 + ARC_RADIUS} 100`}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          initial={reduceMotion ? false : { pathLength: 0 }}
          animate={{ pathLength: ratio }}
          transition={arcTransition}
        />

        {/* Needle */}
        <g
          style={{
            transformOrigin: "100px 100px",
            transformBox: "view-box",
            transform: `rotate(${-90 + ratio * 180}deg)`,
            transition: reduceMotion
              ? "none"
              : `transform ${durationMs}ms cubic-bezier(${motionTokens.ease.join(", ")})`,
          }}
        >
          <line x1="100" y1="100" x2="100" y2="36" stroke="var(--foreground)" strokeWidth="2.5" />
          <circle cx="100" cy="100" r="5" fill="var(--foreground)" />
        </g>

        <text x="24" y="122" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          ₹0
        </text>
        <text x="176" y="122" textAnchor="middle" fill="var(--muted-foreground)" fontSize="9">
          ₹{Math.round(max).toLocaleString("en-IN")}
        </text>
      </svg>
    </div>
  );
}

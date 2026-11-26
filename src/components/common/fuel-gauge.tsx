import { motionTokens } from "@/lib/motion";

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
  const ratio = max > 0 ? Math.min(Math.max(value / max, 0), 1) : 0;
  const overBudget = max > 0 && value > max;
  const durationMs = Math.round(motionTokens.duration.base * 1000);
  const gradientId = `gauge-${label.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
  const path = `M ${100 - ARC_RADIUS} 100 A ${ARC_RADIUS} ${ARC_RADIUS} 0 0 1 ${100 + ARC_RADIUS} 100`;

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

        <path d={path} fill="none" stroke="var(--border)" strokeWidth="10" strokeLinecap="round" />

        <path
          className="motion-gauge-fill"
          d={path}
          fill="none"
          stroke={`url(#${gradientId})`}
          strokeWidth="10"
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - ratio}
          style={
            {
              "--gauge-target": 1 - ratio,
              "--gauge-duration": `${durationMs}ms`,
            } as React.CSSProperties
          }
        />

        <g
          style={{
            transformOrigin: "100px 100px",
            transformBox: "view-box",
            transform: `rotate(${-90 + ratio * 180}deg)`,
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

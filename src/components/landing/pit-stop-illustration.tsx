/**
 * Static fallback for the hero scene: a flat, low-poly-style fuel pump and flag.
 * Used for reduced motion, missing WebGL and low-end devices.
 */
export function PitStopIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 200"
      aria-hidden="true"
      className={className}
      role="presentation"
      preserveAspectRatio="xMidYMid meet"
    >
      <defs>
        <linearGradient id="hero-ground" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="var(--muted)" />
          <stop offset="100%" stopColor="var(--card)" />
        </linearGradient>
      </defs>

      <ellipse cx="160" cy="172" rx="120" ry="20" fill="url(#hero-ground)" />

      {/* Flag */}
      <rect x="228" y="42" width="4" height="122" rx="2" fill="var(--foreground)" opacity="0.45" />
      <g>
        <rect x="232" y="46" width="56" height="40" rx="3" fill="var(--card)" />
        {[0, 1, 2, 3].map((row) =>
          [0, 1, 2, 3].map((column) =>
            (row + column) % 2 === 0 ? (
              <rect
                key={`${row}-${column}`}
                x={232 + column * 14}
                y={46 + row * 10}
                width="14"
                height="10"
                fill="var(--foreground)"
                opacity="0.85"
              />
            ) : null,
          ),
        )}
      </g>

      {/* Pump */}
      <rect x="92" y="62" width="76" height="104" rx="8" fill="var(--accent)" />
      <rect x="100" y="70" width="60" height="40" rx="4" fill="var(--card)" />
      <rect x="106" y="78" width="34" height="6" rx="3" fill="var(--accent)" />
      <rect x="106" y="90" width="46" height="4" rx="2" fill="var(--muted-foreground)" opacity="0.5" />
      <circle cx="130" cy="132" r="16" fill="var(--card)" />
      <path d="M130 132 L130 120" stroke="var(--foreground)" strokeWidth="3" strokeLinecap="round" />
      <circle cx="130" cy="132" r="3" fill="var(--foreground)" />
      <rect x="84" y="160" width="92" height="12" rx="4" fill="var(--foreground)" opacity="0.8" />

      {/* Hose */}
      <path
        d="M168 108 C 196 112, 198 138, 176 148"
        fill="none"
        stroke="var(--foreground)"
        strokeWidth="5"
        strokeLinecap="round"
        opacity="0.75"
      />
      <rect x="172" y="142" width="8" height="24" rx="3" fill="var(--accent)" transform="rotate(-14 176 154)" />

      {/* Snack crate */}
      <rect x="196" y="146" width="26" height="20" rx="4" fill="var(--accent)" transform="rotate(8 209 156)" />
      <rect x="220" y="156" width="18" height="14" rx="3" fill="var(--accent)" opacity="0.6" />
    </svg>
  );
}

import { cn } from "cn";

import { motionTokens } from "@/lib/motion";

/**
 * Reveals content once as it scrolls into view. The browser drives the animation
 * through `animation-timeline`, so the landing route needs no observer or
 * animation library; unsupported browsers simply show the content.
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
  return (
    <div
      className={cn("motion-scroll-reveal", className)}
      style={
        {
          "--reveal-distance": `${distance}px`,
          "--reveal-delay": `${Math.round(delay * 1000)}ms`,
          "--reveal-duration": `${Math.round(motionTokens.duration.landing * 1000)}ms`,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}

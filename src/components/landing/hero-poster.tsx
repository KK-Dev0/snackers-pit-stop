import { PitStopIllustration } from "@/components/landing/pit-stop-illustration";

/**
 * Static hero visual for the public landing route. The optional WebGL scene in
 * `hero-visual.tsx` stays available for app-shell experiments, but the landing
 * page deliberately ships only this server-rendered SVG on mobile.
 */
export function HeroPoster({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`relative overflow-hidden bg-gradient-to-b from-muted/70 to-card ${className ?? ""}`}
      style={{ touchAction: "pan-y" }}
    >
      <PitStopIllustration className="size-full" />
    </div>
  );
}

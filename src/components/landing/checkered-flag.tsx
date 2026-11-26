/**
 * The recurring pit-stop motif: a small checkered flag on a short pole. The
 * sway is CSS-only and stops under the global reduced-motion rule.
 */
export function CheckeredFlag({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`inline-flex items-start ${className ?? ""}`}>
      <span className="h-7 w-px rounded-full bg-foreground/40" />
      <span className="checkered-flag flag-sway -ml-px h-4 w-7 origin-left rounded-[3px] shadow-soft" />
    </span>
  );
}

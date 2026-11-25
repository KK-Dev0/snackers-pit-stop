import Link from "next/link";

/**
 * Wordmark: the display serif for the name and a small checkered-flag square as
 * the only decorative accent. Text stays selectable and readable at 16px.
 */
export function Wordmark({ className }: { className?: string }) {
  return (
    <Link
      href="/"
      className={`group inline-flex items-center gap-2 rounded-md font-display text-lg font-semibold tracking-tight ${className ?? ""}`}
    >
      <span
        aria-hidden="true"
        className="checkered-flag inline-block size-4 rounded-[3px] opacity-90 transition-opacity group-hover:opacity-100"
      />
      <span>
        Snackers <span className="text-muted-foreground">Pit Stop</span>
      </span>
    </Link>
  );
}

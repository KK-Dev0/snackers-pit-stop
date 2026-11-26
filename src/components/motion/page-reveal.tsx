import { cn } from "cn";

/**
 * Lifts a screen's content in on mount using CSS only. The server markup is
 * visible immediately, so slow JavaScript never delays first paint.
 */
export function PageReveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <div
      className={cn("motion-reveal", className)}
      style={delay ? { animationDelay: `${Math.round(delay * 1000)}ms` } : undefined}
    >
      {children}
    </div>
  );
}

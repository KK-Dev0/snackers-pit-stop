import { cn } from "cn";

/**
 * CSS-driven stagger for the landing hero. The first paint is visible; only a
 * small transform runs afterwards, and reduced motion is handled globally.
 */
export function StaggerList({
  children,
  className,
  stagger = 0.06,
}: {
  children: React.ReactNode;
  className?: string;
  stagger?: number;
}) {
  return (
    <div
      className={cn("motion-stagger-list", className)}
      style={{ "--stagger-step": `${Math.round(stagger * 1000)}ms` } as React.CSSProperties}
    >
      {children}
    </div>
  );
}

export function StaggerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={cn("motion-stagger-item", className)}>{children}</div>;
}

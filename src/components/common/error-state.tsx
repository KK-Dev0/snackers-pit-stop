import { TriangleAlertIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";

/** Shared fallback for route error boundaries and inline recoverable failures. */
export function ErrorState({
  title = "Something went wrong",
  description = "This screen could not load. Your saved data stays on this device.",
  retry,
  compact = false,
}: {
  title?: string;
  description?: string;
  retry?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={compact ? "" : "mx-auto w-full max-w-3xl px-5 py-12"}>
      <EmptyState
        icon={TriangleAlertIcon}
        title={title}
        description={description}
        action={
          retry ? (
            <Button type="button" onClick={retry}>
              Try again
            </Button>
          ) : undefined
        }
      />
    </div>
  );
}

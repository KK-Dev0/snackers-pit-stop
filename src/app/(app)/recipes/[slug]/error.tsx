"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/common/error-state";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      title="Recipe unavailable"
      description="We could not read this recipe from the local catalog. Please try again."
      retry={retry}
    />
  );
}

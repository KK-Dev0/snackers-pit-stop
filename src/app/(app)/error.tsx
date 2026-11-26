"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/common/error-state";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <ErrorState
      description="This screen could not load. Your plan and pantry data are still on this device."
      retry={retry}
    />
  );
}

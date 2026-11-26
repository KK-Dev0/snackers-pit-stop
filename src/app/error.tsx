"use client";

import { useEffect } from "react";

import { ErrorState } from "@/components/common/error-state";

export default function Error({ error, retry }: { error: unknown; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return <ErrorState retry={retry} />;
}

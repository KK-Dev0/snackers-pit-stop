import { ListChecksIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Shopping list" };

export default function ListPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="One trip"
        title="Shopping list"
        description="Every ingredient in the week, merged, converted and grouped by aisle."
      />
      <EmptyState
        icon={ListChecksIcon}
        title="Nothing to shop for yet"
        description="Generate a plan and the merged list appears here, minus what you already have."
      />
    </div>
  );
}

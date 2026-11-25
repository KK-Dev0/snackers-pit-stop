import { UserRoundIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Me" };

export default function MePage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="On this device"
        title="Me"
        description="Diet, goals, budget, stores and your data. No account, no sign-in."
      />
      <EmptyState
        icon={UserRoundIcon}
        title="No profile yet"
        description="Your onboarding answers will show up here, ready to edit whenever life changes."
      />
    </div>
  );
}

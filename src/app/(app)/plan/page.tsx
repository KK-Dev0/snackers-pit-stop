import { CalendarDaysIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";

export const metadata = { title: "Plan" };

export default function PlanPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="This week"
        title="Your week, sorted"
        description="Breakfast, lunch, snack and dinner for seven days — built around your diet, calories and budget."
      />
      <EmptyState
        icon={CalendarDaysIcon}
        title="No plan yet"
        description="Finish onboarding and generate a week of meals in one tap. Swaps and locks arrive with the planner."
      />
    </div>
  );
}

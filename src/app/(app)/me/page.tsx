"use client";

import Link from "next/link";
import { UserRoundIcon } from "lucide-react";

import { EmptyState } from "@/components/common/empty-state";
import { PageHeader } from "@/components/common/page-header";
import { PageReveal } from "@/components/motion/page-reveal";
import { useProfile } from "@/client/hooks/use-profile";

export default function MePage() {
  const profile = useProfile();

  if (profile === undefined) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
        <PageHeader eyebrow="On this device" title="Me" description="Loading…" />
      </PageReveal>
    );
  }

  if (!profile) {
    return (
      <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
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
        <Link href="/onboarding" className="text-primary underline">
          Start onboarding
        </Link>
      </PageReveal>
    );
  }

  return (
    <PageReveal className="mx-auto w-full max-w-5xl space-y-6 px-5 py-8 sm:px-6">
      <PageHeader
        eyebrow="On this device"
        title="Me"
        description="Diet, goals, budget, stores and your data. No account, no sign-in."
      />
      <div className="rounded-lg border bg-card p-6 space-y-2">
        <p>
          <strong>Diet:</strong> {profile.diet}
        </p>
        <p>
          <strong>Servings:</strong> {profile.servings}
        </p>
        <p>
          <strong>Calorie goal:</strong> {profile.calorieGoal} kcal/day
        </p>
        <p>
          <strong>Weekly budget:</strong> ₹{profile.weeklyBudgetInr}
        </p>
        <p>
          <strong>Allergens:</strong> {profile.allergens.join(", ") || "none"}
        </p>
        <p>
          <strong>Dislikes:</strong> {profile.dislikes.join(", ") || "none"}
        </p>
        <p>
          <strong>Pincode:</strong> {profile.pincode ?? "not set"}
        </p>
        <p>
          <strong>Stores:</strong> {profile.storeIds.join(", ") || "none"}
        </p>
      </div>
      <Link href="/onboarding" className="text-primary underline">
        Edit profile
      </Link>
    </PageReveal>
  );
}
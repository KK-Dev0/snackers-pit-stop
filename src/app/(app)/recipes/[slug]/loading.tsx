import { RecipeDetailSkeleton } from "@/components/common/states";

export default function Loading() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-8 sm:px-6">
      <RecipeDetailSkeleton />
    </div>
  );
}

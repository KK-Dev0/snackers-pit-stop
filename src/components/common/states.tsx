import { Skeleton } from "@/components/ui/skeleton";

/** Skeletons mirror the final layout so async branches do not shift content. */

export function PageHeaderSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-2">
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-8 w-2/3 max-w-xs" />
      <Skeleton className="h-4 w-full max-w-md" />
    </div>
  );
}

export function RecipeCardSkeleton() {
  return (
    <div aria-hidden="true" className="flex h-40 flex-col gap-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-2">
        <Skeleton className="h-5 w-2/3" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-4/5" />
      <div className="mt-auto flex gap-2">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-4 w-20" />
      </div>
    </div>
  );
}

export function RecipeCardGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div aria-hidden="true" className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }, (_, index) => (
        <RecipeCardSkeleton key={index} />
      ))}
    </div>
  );
}

export function RecipeDetailSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <Skeleton className="h-8 w-32" />
      <PageHeaderSkeleton />
      <div className="grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
        <Skeleton className="h-20 rounded-xl" />
      </div>
      <Skeleton className="h-64 w-full rounded-xl" />
      <Skeleton className="h-40 w-full rounded-xl" />
    </div>
  );
}

export function PlanSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-6">
      <PageHeaderSkeleton />
      <Skeleton className="h-10 w-full rounded-lg" />
      <Skeleton className="h-32 w-full rounded-lg" />
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-7">
        {Array.from({ length: 7 }, (_, day) => (
          <div key={day} className="space-y-2 rounded-lg border bg-card p-3">
            <Skeleton className="h-5 w-20" />
            <Skeleton className="h-3 w-24" />
            {Array.from({ length: 4 }, (_, slot) => (
              <Skeleton key={slot} className="h-14 w-full rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export function ShoppingListSkeleton() {
  return (
    <div aria-hidden="true" className="space-y-4">
      <Skeleton className="h-28 w-full rounded-xl" />
      {Array.from({ length: 3 }, (_, section) => (
        <div key={section} className="space-y-2 rounded-xl border bg-card p-4">
          <Skeleton className="h-5 w-28" />
          {Array.from({ length: 4 }, (_, row) => (
            <Skeleton key={row} className="h-10 w-full rounded-md" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function StoreListSkeleton() {
  return (
    <div aria-hidden="true" className="grid gap-3 sm:grid-cols-2">
      {Array.from({ length: 4 }, (_, index) => (
        <Skeleton key={index} className="h-24 w-full rounded-xl" />
      ))}
    </div>
  );
}

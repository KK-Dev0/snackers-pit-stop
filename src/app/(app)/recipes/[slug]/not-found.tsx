import Link from "next/link";

import { EmptyState } from "@/components/common/empty-state";
import { Button } from "@/components/ui/button";
import { SearchIcon } from "lucide-react";

export default function RecipeNotFound() {
  return (
    <div className="mx-auto w-full max-w-3xl px-5 py-12">
      <EmptyState
        icon={SearchIcon}
        title="Recipe not found"
        description="This recipe is no longer in the catalog. Browse the rest of the collection instead."
        action={
          <Button asChild>
            <Link href="/recipes">Browse recipes</Link>
          </Button>
        }
      />
    </div>
  );
}

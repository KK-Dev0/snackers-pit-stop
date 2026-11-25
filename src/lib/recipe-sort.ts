export type RecipeSort = "recent" | "title" | "time";

type SortableRecipe = {
  title: string;
  prepMin?: number | null;
  cookMin?: number | null;
  createdAt?: number | null;
};

/** Stable, non-mutating sort used by the recipe list API. */
export function sortRecipes<T extends SortableRecipe>(items: T[], sort: RecipeSort): T[] {
  const copy = [...items];
  switch (sort) {
    case "title":
      return copy.sort((a, b) => a.title.localeCompare(b.title));
    case "time":
      return copy.sort(
        (a, b) =>
          (a.prepMin ?? 0) + (a.cookMin ?? 0) - ((b.prepMin ?? 0) + (b.cookMin ?? 0)),
      );
    case "recent":
    default:
      return copy.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
  }
}

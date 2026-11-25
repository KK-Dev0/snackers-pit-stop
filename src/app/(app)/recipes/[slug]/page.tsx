import { notFound } from "next/navigation";

import { RecipeDetail } from "@/components/recipes/recipe-detail";
import { IngredientListSchema, RecipeSchema } from "@/lib/schemas";
import { getDb } from "@/server/db/client";
import { listIngredients } from "@/server/db/queries/ingredients";
import { getRecipeBySlug } from "@/server/db/queries/recipes";

export const dynamic = "force-dynamic";
export const metadata = { title: "Recipe" };

export default async function RecipePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const db = getDb();
  const [row, ingredientRows] = await Promise.all([
    getRecipeBySlug(slug, db),
    listIngredients(db),
  ]);
  if (!row) notFound();

  const recipe = RecipeSchema.safeParse(row);
  if (!recipe.success) notFound();
  const ingredients = IngredientListSchema.safeParse(ingredientRows);

  return (
    <RecipeDetail
      recipe={recipe.data}
      ingredients={ingredients.success ? ingredients.data : []}
    />
  );
}

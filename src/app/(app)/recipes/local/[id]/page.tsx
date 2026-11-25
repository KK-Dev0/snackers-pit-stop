import { LocalRecipeDetail } from "@/components/recipes/local-recipe-detail";

export const metadata = { title: "Imported recipe" };

export default async function LocalRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <LocalRecipeDetail id={id} />;
}

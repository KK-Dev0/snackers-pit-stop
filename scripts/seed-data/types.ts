export type SeedIngredient = {
  id: string;
  name: string;
  aliases?: string[];
  aisle:
    | "produce"
    | "dairy"
    | "staples"
    | "spices"
    | "protein"
    | "bakery"
    | "other";
  baseUnit: "g" | "ml" | "piece";
  pieceGrams?: number | null;
  kcalPer100: number;
  proteinGPer100?: number;
  carbsGPer100?: number;
  fatGPer100?: number;
  fiberGPer100?: number;
  sodiumMgPer100?: number;
  defaultPriceInr: number;
  priceBasis: "100g" | "100ml" | "piece";
  dietTags?: string[];
  allergenTags?: string[];
  isStaple?: boolean;
};

export type SeedRecipeIngredient = {
  rawName: string;
  ingredientId?: string | null;
  quantity: number;
  unit: string;
  grams?: number | null;
  optional?: boolean;
  sortOrder: number;
};

export type SeedRecipe = {
  id: string;
  slug: string;
  title: string;
  description: string;
  cuisine: string;
  diet: "vegan" | "veg" | "eggetarian" | "nonveg";
  mealSlots: string[];
  servings: number;
  prepMin: number;
  cookMin: number;
  steps: string[];
  imageUrl?: string | null;
  sourceUrl?: string | null;
  sourceType: "seed";
  allergens?: string[];
  tags?: string[];
  ingredients: SeedRecipeIngredient[];
};

export type SeedStore = {
  id: string;
  name: string;
  type: "quick_commerce" | "grocery" | "local";
  linkTemplate?: string | null;
  sortOrder: number;
};

export type SeedPincodeStore = {
  pincode: string;
  storeId: string;
  confirmedCount?: number;
  lastConfirmedAt?: number | null;
};
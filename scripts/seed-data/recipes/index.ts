import type { SeedRecipe } from "../types";

import { recipes as breakfast } from "./breakfast";
import { recipes as veg } from "./veg";
import { recipes as eggetarian } from "./eggetarian";
import { recipes as nonveg } from "./nonveg";
import { recipes as vegan } from "./vegan";
import { recipes as onepot } from "./onepot";
import { recipes as snacks } from "./snacks";
import { recipes as regional } from "./regional";

export const recipes: SeedRecipe[] = [
  ...breakfast,
  ...veg,
  ...eggetarian,
  ...nonveg,
  ...vegan,
  ...onepot,
  ...snacks,
  ...regional,
];
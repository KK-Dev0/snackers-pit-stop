import {
  CalendarDaysIcon,
  ChefHatIcon,
  ListChecksIcon,
  ShoppingBasketIcon,
  UserRoundIcon,
} from "lucide-react";

/** Primary destinations, shared by the desktop top nav and the mobile tab bar. */
export const appNav = [
  { href: "/plan", label: "Plan", icon: CalendarDaysIcon },
  { href: "/recipes", label: "Recipes", icon: ChefHatIcon },
  { href: "/pantry", label: "Pantry", icon: ShoppingBasketIcon },
  { href: "/list", label: "List", icon: ListChecksIcon },
  { href: "/me", label: "Me", icon: UserRoundIcon },
] as const;

export type AppNavItem = (typeof appNav)[number];

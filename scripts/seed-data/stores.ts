import type { SeedStore, SeedPincodeStore } from "./types";

export const stores: SeedStore[] = [
  {
    id: "blinkit",
    name: "Blinkit",
    type: "quick_commerce",
    linkTemplate: "https://blinkit.com/s/?q={query}",
    sortOrder: 1,
  },
  {
    id: "zepto",
    name: "Zepto",
    type: "quick_commerce",
    linkTemplate: "https://www.zeptonow.com/search?query={query}",
    sortOrder: 2,
  },
  {
    id: "instamart",
    name: "Swiggy Instamart",
    type: "quick_commerce",
    linkTemplate: "https://www.swiggy.com/instamart/search?query={query}",
    sortOrder: 3,
  },
  {
    id: "apna-mart",
    name: "Apna Mart",
    type: "grocery",
    linkTemplate: "https://www.apnamart.in/search?q={query}",
    sortOrder: 4,
  },
  {
    id: "local-kirana",
    name: "Other local kirana",
    type: "local",
    linkTemplate: null,
    sortOrder: 5,
  },
];

// Asansol pincodes (seed/test data, unverified). confirmedCount 0 = unconfirmed.
const asansolPincodes = [
  "713301",
  "713302",
  "713303",
  "713304",
  "713305",
  "713321",
  "713329",
];

export const pincodeStores: SeedPincodeStore[] = asansolPincodes.flatMap((pincode) =>
  stores.map((store) => ({
    pincode,
    storeId: store.id,
    confirmedCount: 0,
    lastConfirmedAt: null,
  })),
);
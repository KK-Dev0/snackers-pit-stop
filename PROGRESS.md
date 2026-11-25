# PROGRESS

Living checklist for **Snackers Pit Stop**. Each task is scoped to roughly 15 minutes. Tick a box only when the task is complete and verified.

**Status:** 47 of 112 complete · **Current:** M2 complete — next is task 48.

## How to use

- Work top to bottom. Do not start a milestone gate until every task above it is checked.
- Run lint, typecheck and tests before each gate commit.
- If a task grows past ~20 minutes, split it in `PLAN.md` and here before continuing.
- Commit messages are listed on each gate task.


### M0 — Planning
- [x] 1. **Write PLAN.md and PROGRESS.md.** Architecture, folder structure, data model, and a 15-minute task list. *(done)*

### M1 — Scaffold, design system, landing
- [x] 2. **Scaffold the app.** Create the Next.js App Router project with TypeScript strict, ESLint, Prettier, `src/`, `@/*` alias, scripts for dev/build/lint/typecheck/test, and a `.gitignore` covering `.env`, `.env.local`, `node_modules`, `.next`, and local SQLite files.
- [x] 3. **Set up design tokens.** Tailwind + `globals.css` with cream/forest/saffron/tomato CSS variables for light and dark, radii, shadows, and Fraunces + DM Sans via `next/font`.
- [x] 4. **Install shadcn/ui.** Init `components.json` and add button, card, input, label, textarea, select, checkbox, switch, tabs, dialog, sheet, dropdown-menu, badge, skeleton, progress, separator, tooltip, sonner.
- [x] 5. **Add theming.** `next-themes` provider, no-flash script, theme toggle, and system/light/dark persistence.
- [x] 6. **Build the app shell.** Root layout metadata/viewport, skip link, desktop top nav, mobile bottom tab bar, and stub routes for Plan, Recipes, Pantry, List, Me, Onboarding.
- [x] 7. **Add motion primitives.** `PageReveal`, `StaggerList`, `CardLift`, and a reduced-motion hook; cap app-screen animations at 400 ms.
- [x] 8. **Build the landing hero.** Headline, subcopy, CTAs, and a lightweight animated pit-stop/checkered-flag motif that respects reduced motion.
- [x] 8b. **Add the R3F hero scene.** Install three, @types/three and @react-three/fiber. Build a low-poly scene (about 10 simple meshes, no shadows, no postprocessing, avoid drei unless needed) in a client component loaded with next/dynamic and ssr:false, only when the hero is in view. Cap dpr at 1.5, pause rendering when the tab is hidden or the hero is offscreen, keep touch scrolling working (touch-action: pan-y), and fall back to a static CSS/SVG hero when prefers-reduced-motion is set, WebGL is unavailable, or the device looks low-end. Verify with build and Lighthouse mobile. If it exceeds 20 minutes, split it.
- [x] 9. **Build landing sections.** Three-step "how it works", feature cards, and the "free, private, no signup" band.
- [x] 10. **Finish the landing page.** Footer, final CTA, scroll reveals, responsive polish, and accessible landmarks/headings.
- [x] 11. **Audit landing quality.** Keyboard pass, contrast check, font/image weight, and fix what the audit finds.
- [x] 12. **Gate M1.** Run lint, typecheck, and build; smoke-check mobile and desktop; commit `feat: scaffold, design system, and landing page`.

### M2 — Data model, seed data, retrieval
- [x] 13. **Add env handling.** Zod-validated `src/lib/env.ts`, `.env.example`, and clear errors for missing server vars.
- [x] 14. **Wire the database.** Drizzle + `@libsql/client` with a local file URL in dev and Turso in prod; `drizzle.config.ts` and db scripts.
- [x] 15. **Model ingredients.** Drizzle table with nutrition per 100 g/ml, default INR price, aisle, base unit, diet/allergen tags, and staple flag.
- [x] 16. **Model recipes.** `recipes` and `recipe_ingredients` tables with diet, slots, servings, steps, source metadata, and normalized grams.
- [x] 17. **Model stores.** `stores`, `pincode_stores`, and `store_confirmations` tables with indexes and no PII.
- [x] 18. **Add migrations + FTS5.** Generate the initial migration, create the `recipe_fts` virtual table, and add a rebuild step to the seed pipeline.
- [x] 19. **Seed ingredients 1/4.** ~40 staples: grains, dals, flours, rice, oats and pasta with per-100 g nutrition and prices.
- [x] 20. **Seed ingredients 2/4.** ~40 produce and dairy items with aisle, unit, nutrition, and prices.
- [x] 21. **Seed ingredients 3/4.** ~40 spices, oils, condiments and aromatics with realistic small-unit prices.
- [x] 22. **Seed ingredients 4/4.** ~30 proteins, eggs, nuts and packaged items; add a seed test for unique ids and sane values.
- [x] 23. **Seed recipes 1/13.** Five budget breakfasts (poha, upma, besan chilla, masala oats, veg sandwich) with structured ingredients and steps.
- [x] 24. **Seed recipes 2/13.** Five breakfasts (aloo paratha, idli-sambar, egg bhurji toast, rava dosa, thepla).
- [x] 25. **Seed recipes 3/13.** Five veg lunch/dinner dishes (dal tadka rice, rajma chawal, chole roti, mixed veg sabzi, curd rice).
- [x] 26. **Seed recipes 4/13.** Five veg dishes (palak paneer, aloo gobi, bhindi masala, lauki dal, veg pulao).
- [x] 27. **Seed recipes 5/13.** Five veg dishes (paneer bhurji, baingan bharta, cabbage poriyal, budget dal makhani, tomato rice).
- [x] 28. **Seed recipes 6/13.** Five eggetarian dishes (egg curry, egg fried rice, egg roast, omelette wrap, egg chaat).
- [x] 29. **Seed recipes 7/13.** Five non-veg dishes (chicken curry, chicken keema, fish curry, chicken stew, chilli chicken).
- [x] 30. **Seed recipes 8/13.** Five non-veg dishes (chicken biryani, butter chicken, fish fry, chicken salad, keema pav).
- [x] 31. **Seed recipes 9/13.** Five vegan dishes (chana masala, tofu bhurji, vegetable khichdi, peanut chutney rice, dal palak).
- [x] 32. **Seed recipes 10/13.** Five vegan dishes (sambar rice, lemon rice, coconut vegetable curry, chole palak, roasted veg wrap).
- [x] 33. **Seed recipes 11/13.** Five one-pot/rice dishes (veg biryani, jeera rice dal, masala khichdi, tomato bath, curd rice bowl).
- [x] 34. **Seed recipes 12/13.** Five snacks (onion pakora, dhokla, bhel, grilled sandwich, fruit chaat).
- [x] 35. **Seed recipes 13/13.** Five regional/high-protein dishes (litti chokha, cholar dal, soya chunk curry, sprout salad, paneer tikka bowl); add a recipe integrity test.
- [x] 36. **Seed stores + pincodes.** Blinkit, Zepto, Instamart, Apna Mart and local kirana, plus Asansol pincode rows marked unverified.
- [x] 37. **Define shared Zod schemas.** Profile, ingredient, recipe, recipe draft, plan, shopping list, store and API schemas with inferred types.
- [x] 38. **Build server repositories.** Recipe list/detail/filter, ingredient lookup, store-by-pincode, and confirmation queries.
- [x] 39. **Implement nutrition math.** Per-100 g/ml → serving calories/macros with rounding and estimate flags; unit tests.
- [x] 40. **Implement unit conversion.** g/kg, ml/l, tsp/tbsp/cup, piece↔grams; reject incompatible families; unit tests.
- [x] 41. **Implement cost math.** Ingredient price × normalized quantity, per recipe and per serving; unit tests.
- [x] 42. **Build retrieval filters.** Hard filter by diet, allergens and dislikes in SQL behind a typed `RecipeRetriever` interface.
- [x] 43. **Add ranking.** FTS5 bm25 + pantry-overlap score + variety signal, returning a score breakdown and reasons.
- [x] 44. **Add embeddings flag.** `EmbeddingRanker` behind `EMBEDDINGS_ENABLED=false`; no network calls while disabled.
- [x] 45. **Test retrieval.** Filtering correctness, allergen exclusion, pantry-first ordering, and empty-query behavior.
- [x] 46. **Add recipe endpoints.** `GET /api/recipes` and `GET /api/recipes/[slug]` with validated params and cache headers.
- [x] 47. **Gate M2.** Migrate, seed, run lint/typecheck/tests, verify FTS results; commit `feat: data model, seed catalog, and retrieval`.

### M3 — Onboarding and planner
- [x] 48. **Set up Dexie.** Versioned IndexedDB schema for profile, pantry, plans, meals, imports, price overrides, list state, stores and settings.
- [x] 49. **Add client repositories.** Typed CRUD and React hooks for profile, pantry, plans, imports and stores using live queries.
- [x] 50. **Build the onboarding shell.** Four steps, progress indicator, skip/resume, and redirect rules based on `onboardedAt`.
- [x] 51. **Step 1: diet.** Diet type and household servings with accessible radio cards.
- [x] 52. **Step 2: goals.** Calorie goal and weekly INR budget with validation and sensible defaults.
- [x] 53. **Step 3: preferences.** Allergen and dislike chips with custom entry and a best-effort filtering note.
- [x] 54. **Step 4: location + stores.** Manual pincode for now (geo arrives in M6) plus store selection; finishing saves the profile and routes to Plan.
- [x] 55. **Add profile summary.** Me page shows diet, goals, budget, allergens, pincode and stores, with edit links back into onboarding.
- [x] 56. **Data export/import/clear.** JSON export, import with Zod validation, and clear all data with confirmation.
- [x] 57. **Write the planner algorithm.** Deterministic seeded selection across 7 days × 4 slots with calorie targets, budget cap, variety and locks as pure functions.
- [x] 58. **Test the planner.** Locks respected, no repeats, calorie/budget bounds, and deterministic output for the same seed.
- [x] 59. **Add the recommend endpoint.** `POST /api/recipes/recommend` validates filters/pantry, rate-limits, and returns a ranked pool.
- [ ] 60. **Build the planner page.** 7-day grid with meal cards, skeletons, an empty state, and a "Generate plan" action.
- [ ] 61. **Add day and week meters.** Per-day calories/cost plus a fuel-gauge weekly budget meter with accessible values.
- [ ] 62. **Add meal swap.** Bottom sheet with ranked alternatives, nutrition/cost preview, and one-tap replace.
- [ ] 63. **Add meal lock + regenerate.** Lock/unlock meals and regenerate the rest without touching locked slots.
- [ ] 64. **Add drag reorder.** dnd-kit drag between slots/days with layout animation and keyboard support.
- [ ] 65. **Persist and navigate weeks.** Save plans/meals in Dexie, add prev/current/next week switching and "copy last week".
- [ ] 66. **Gate M3.** Lint, typecheck, unit tests, and a manual onboarding→plan pass; commit `feat: onboarding and weekly planner`.

### M4 — Import flows
- [ ] 67. **Build the LLM wrapper.** Provider-agnostic chat/vision client from env with timeouts, token caps and typed errors.
- [ ] 68. **Add strict JSON generation.** Zod-validated output with exactly one repair retry; test invalid→valid.
- [ ] 69. **Add IP rate limiting.** Hashed-IP sliding window utility with per-route limits and tests; apply it to all LLM/import routes.
- [ ] 70. **Build safe URL fetching.** http/https only, private-IP blocking, 8 s timeout, 2 MB cap, content-type checks, and tests.
- [ ] 71. **Parse schema.org JSON-LD.** Extract Recipe objects, map fields/ingredients/units, and test messy real-world shapes.
- [ ] 72. **Add the URL import route.** `POST /api/import/url` uses JSON-LD first and the LLM only as fallback, returning a validated draft.
- [ ] 73. **Write the extraction prompt.** Strict JSON recipe schema, no invented nutrition or prices, source attribution, and refusal rules.
- [ ] 74. **Add photo import (optional).** `POST /api/import/photo` with image type/size validation and a vision model returning the same draft schema; gated behind `PHOTO_IMPORT_ENABLED=false` by default and hidden in the UI while disabled.
- [ ] 75. **Build the import review form.** Editable title, servings, ingredients, units, steps, diet/allergen tags and source link.
- [ ] 76. **Save imports locally.** Persist to Dexie, list under "My imports", support delete, and render a local recipe detail route.
- [ ] 77. **Build recipe browsing.** Search, diet/allergen filters, sort, limit, cards and skeletons.
- [ ] 78. **Build recipe detail.** Servings scaling, computed nutrition/cost estimates, add-to-plan, and source link.
- [ ] 79. **Polish import UX.** Entry points, progress, validation errors, retry, and "review before saving" messaging.
- [ ] 80. **Gate M4.** Lint, typecheck, tests, and a manual URL/photo import; commit `feat: recipe import from URL and photo`.

### M5 — Pantry and shopping list
- [ ] 81. **Build pantry CRUD.** Add/edit/delete items with quantity, unit and staple toggle; persist in Dexie.
- [ ] 82. **Polish pantry.** Search/sort, empty state, and quick-add suggestions from seeded ingredients.
- [ ] 83. **Add "use it up".** Rank recipes by pantry overlap and surface them on Pantry with reasons.
- [ ] 84. **Normalize and merge ingredients.** Alias mapping, canonical units and merge rules; unit tests.
- [ ] 85. **Build the shopping list generator.** Scale plan ingredients, merge, convert/combine units, and test edge cases.
- [ ] 86. **Subtract pantry.** Handle full and partial quantities, staples policy, and tests.
- [ ] 87. **Group by aisle.** Stable aisle order, manual reorder, and collapsed sections.
- [ ] 88. **Build the list page.** Generate from the active plan, show grouped items/counts, and handle the no-plan state.
- [ ] 89. **Add check-off.** Animated check with strike-through, persisted state, reset, and aria-live updates.
- [ ] 90. **Add copy/share.** Web Share API with WhatsApp-friendly plain text and a clipboard fallback.
- [ ] 91. **Add store handoff.** Per-ingredient and whole-list open-and-search links from templates with copy fallback; tests.
- [ ] 92. **Gate M5.** Lint, typecheck, tests, and a manual plan→list pass; commit `feat: pantry and merged shopping list`.

### M6 — Location and stores
- [ ] 93. **Build the geo interface.** Swappable provider + Nominatim reverse geocoder honoring the UA policy and 1 req/s, with manual pincode fallback.
- [ ] 94. **Add the reverse-geocode route.** `POST /api/geo/reverse` validates coordinates and returns only pincode/city/state; tests.
- [ ] 95. **Add location UX.** "Use my location" with permission/denied/timeout states; store the pincode only, never coordinates.
- [ ] 96. **Add the stores API.** `GET /api/stores?pincode=` returns seeded stores with confirmed/unconfirmed status and counts.
- [ ] 97. **Build the store picker.** Toggles, "Do you use this here?", custom kirana rename, and the crowdsourcing note.
- [ ] 98. **Add confirmation voting.** `POST /api/stores/confirm` with IP-hash rate limits, count increment, and tests.
- [ ] 99. **Integrate stores.** Use selections in onboarding and list handoff; the user's selection always wins.
- [ ] 100. **Gate M6.** Lint, typecheck, tests, and a manual pincode flow; commit `feat: location and store availability`.

### M7 — Polish, tests, PWA, README
- [ ] 101. **Add the PWA manifest.** Name, icons (192/512/maskable), theme colors, standalone display, and install metadata.
- [ ] 102. **Add the service worker.** Serwist offline shell, static caching, network-first API fallback, and an offline banner.
- [ ] 103. **Add the About and Disclaimers page.** Not medical advice, estimates only, allergen filtering is best-effort, no affiliation with listed stores; link it from the footer and Me.
- [ ] 104. **Accessibility audit.** Keyboard paths, focus-visible, labels/aria, heading order, live regions, and contrast fixes.
- [ ] 105. **Dark mode audit.** Every screen, gauge, skeleton and toast; fix token misuse.
- [ ] 106. **Motion audit.** Reduced-motion coverage, 400 ms cap on app screens, no layout jank, and skeleton timing.
- [ ] 107. **Performance pass.** Font/image optimization, bundle trimming, route-level code splitting, and Lighthouse 90+ on mobile.
- [ ] 108. **Polish states.** Consistent skeletons, empty states, error boundaries, toasts, and retry actions.
- [ ] 109. **Add the Playwright smoke test.** Onboarding → generate plan → shopping list against a seeded local DB.
- [ ] 110. **Write the README.** Setup, env vars, Vercel + Turso deploy, assumptions, limitations, disclaimers, and roadmap.
- [ ] 111. **Final gate.** Lint, typecheck, all tests, build, Lighthouse and smoke test; commit `chore: polish, tests, PWA, and docs`.
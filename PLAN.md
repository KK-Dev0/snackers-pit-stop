> PROGRESS.md is the source of truth for the task list and numbering (111 tasks). The task list in section 7 is outdated; follow PROGRESS.md.

# Snackers Pit Stop — Build Plan

A free, mobile-first meal-planning PWA for students and young professionals in India. Plan a week around diet, calories, budget and pantry; import recipes from links or photos; merge everything into one shopping list; hand off to the stores the user actually uses.

This plan is the source of truth for architecture, structure, data, and execution order. `PROGRESS.md` mirrors the task list as a checklist.

---

## 1. Assumptions and decisions

- **One device, one profile.** No accounts, sync, or server-side personal data in v1. Clearing browser data clears the profile.
- **Catalog is server-side; life is device-side.** Recipes, ingredients, stores and crowdsourced availability live in SQLite/libSQL. Profile, pantry, plans, imports, list state, price edits and store choices live in IndexedDB.
- **Plan generation is deterministic, not LLM.** A pure algorithm selects meals. The LLM is only used to import/extract recipes and write short explanations. It never computes calories or prices.
- **Four meal slots:** breakfast, lunch, snack, dinner. Servings are per person; household servings scale the list.
- **All nutrition and costs are estimates.** Calories come from a seeded per-100 g/ml table. Prices are seeded rough INR defaults, user-editable. No live price scraping.
- **Asansol is seed/test data only.** Pincode availability rows are unverified. The app works for any valid Indian pincode; unknown pincodes show all stores as unconfirmed.
- **Store integration is handoff only.** Search links are built from templates and opened in a new tab. No scraping, private APIs, logins, or ordering. Templates must be verified per store.
- **Location is optional.** Geolocation is requested only on tap. Coordinates are used transiently for reverse geocoding and never stored; only the pincode is kept.
- **Imported recipes are device-only.** They are saved to Dexie and can be used in plans and lists, but are not published to the shared catalog.
- **UI language is English** with Indian dish names kept intact. Metric units, INR, Monday-start weeks.
- **Target runtime:** current stable Next.js App Router, Node runtime for API routes. Local SQLite file in development, Turso in production.

---

## 2. Architecture

### 2.1 Stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js App Router + React + TypeScript (strict) |
| Styling | Tailwind CSS + CSS variables + shadcn/ui |
| Motion | Framer Motion (`framer-motion`), reduced-motion aware |
| Server data | Drizzle ORM + `@libsql/client` (SQLite locally, Turso in prod) |
| Device data | Dexie 4 on IndexedDB |
| Server reads | TanStack Query |
| Forms | React Hook Form + Zod resolver |
| Drag and drop | dnd-kit |
| PWA | Web manifest + Serwist service worker |
| Validation | Zod everywhere (env, API, forms, DB boundaries) |
| Tests | Vitest (unit), Playwright (one smoke flow) |
| Icons | Lucide React |

### 2.2 System boundary

```text
┌──────────────────────────── Device (browser) ────────────────────────────┐
│  App Router UI (server components for catalog, client for interaction)    │
│                                                                           │
│  Dexie / IndexedDB                    TanStack Query cache                │
│  profile, pantry, plans, meals,       recipes, stores, availability       │
│  imports, price overrides,                                                │
│  list checks, user stores, settings                                       │
└───────────────┬───────────────────────────────────────────────────────────┘
                │ fetch (Zod-validated JSON / multipart)
┌───────────────▼──────────────────────────── Server (Next.js) ─────────────┐
│  Route handlers: validation → rate limit → service → response             │
│                                                                           │
│  Retrieval service        LLM wrapper          Geo provider               │
│  hard filters + FTS5      JSON + 1 retry       reverse geocode → pincode  │
│  + pantry overlap                                                         │
│                                                                           │
│  Drizzle ORM → libSQL (local file / Turso)                                │
│  ingredients, recipes, recipe_ingredients, stores, pincode_stores,        │
│  store_confirmations, recipe_fts                                          │
└───────────────────────────────────────────────────────────────────────────┘
```

### 2.3 Data flows

- **Onboarding:** local form → Zod → Dexie `profile` → redirect to Plan. Skippable; defaults are applied and editable.
- **Planner:** device sends diet/allergen/dislike filters and pantry names to `/api/recipes/recommend` → ranked pool returns → pure planner runs on device with local imports → meals saved in Dexie.
- **Recipes:** catalog browse/detail reads server routes; imported recipes read Dexie. Both render through one shared recipe view model.
- **Shopping list:** computed entirely on device from plan meals + pantry + price overrides. No server round-trip.
- **Stores:** pincode → `/api/stores` → availability rows; user selection is local and always wins. Confirmation votes go to `/api/stores/confirm`.
- **Import:** URL or photo → API → validated draft → user review/edit → Dexie.

### 2.4 Retrieval (RAG) design

`RecipeRetriever` is an interface with one v1 implementation:

1. **Hard filters (SQL):** diet compatibility, allergen exclusion, dislike exclusion, meal slot.
2. **Text relevance:** SQLite FTS5 over title, description, tags and ingredient names, ranked with `bm25`.
3. **Pantry overlap:** count and weight matched ingredient ids/aliases; prefer recipes that use what is already at home.
4. **Composite score:** `0.45 * fts + 0.40 * pantry + 0.15 * variety`, normalized to 0–1, with a reason breakdown.
5. **Embeddings (off by default):** `EMBEDDINGS_ENABLED=false`; an `EmbeddingRanker` can rerank the filtered set when enabled. No network calls while disabled.

All filtering is best-effort. The UI states that users must check labels for allergens.

### 2.5 LLM boundary

- `src/server/llm/provider.ts` exposes `chat()` and `vision()` against an OpenAI-compatible API configured by env.
- `src/server/llm/json.ts` exposes `generateJson({ schema, messages, images? })`: temperature ~0.2, timeout, token cap, Zod parse, **exactly one repair retry** with the validation error, then a typed failure.
- Prompts live in `src/server/llm/prompts.ts`. They forbid inventing nutrition, prices, or article text, and require a source URL when available.
- Every LLM route is per-IP rate limited. No API keys reach the client.
- URL import tries schema.org JSON-LD first and calls the LLM only when structured data is missing.
- Photo import sends a downscaled image to a vision model and returns the same `RecipeDraft` schema.

### 2.6 Computation ownership

- **Nutrition:** `src/lib/nutrition.ts` converts ingredient quantities to grams/ml, then applies per-100 values. Rounded and labelled "estimate".
- **Cost:** `src/lib/cost.ts` applies seeded or overridden INR prices to normalized quantities.
- **Units:** `src/lib/units.ts` owns conversion and compatibility rules.
- **Planner:** `src/lib/planner.ts` is pure, seeded and testable.
- **Shopping list:** `src/lib/shopping-list.ts` owns merge, conversion, pantry subtraction and aisle grouping.

### 2.7 Design system

**Palette (CSS variables, WCAG AA checked):**

| Token | Light | Dark | Use |
| --- | --- | --- | --- |
| `--background` | `#FAF4E8` | `#121713` | Warm cream / deep charcoal |
| `--foreground` | `#1B2A22` | `#EDE6D6` | Primary text |
| `--card` | `#FFFBF2` | `#1A211C` | Cards and sheets |
| `--primary` | `#B45309` | `#F0A83C` | Saffron actions |
| `--primary-foreground` | `#FFFFFF` | `#121713` | Text on primary |
| `--accent` | `#1F4D3A` | `#7FB79A` | Forest accents |
| `--destructive` | `#B91C1C` | `#F87171` | Tomato alerts |
| `--muted` | `#EFE6D6` | `#232B25` | Quiet surfaces |
| `--muted-foreground` | `#5B665F` | `#A8B2AA` | Secondary text |
| `--border` | `#E2D7C3` | `#2F3A32` | Borders |
| `--ring` | `#B45309` | `#F0A83C` | Focus rings |

- **Type:** Fraunces (display serif) + DM Sans (UI), loaded with `next/font`.
- **Shape:** 14–20 px radii, soft layered shadows, generous 4/8 px spacing scale.
- **Motif:** a small checkered-flag accent, fuel-gauge meters, dashed "pit lane" dividers. Used sparingly, never as decoration noise.
- **Motion:** page-load stagger 40–80 ms, card hover lift 2–4 px, check-off spring, layout transitions for meal moves. App screens ≤ 400 ms; landing up to 600 ms. `prefers-reduced-motion` removes transforms and long fades. WebGL is allowed only for one contained react-three-fiber hero scene on the landing page (dpr ≤ 1.5, paused when the tab is hidden or the hero is offscreen, static CSS/SVG fallback); app screens never use WebGL. No scroll-jacking anywhere.
- **Navigation:** mobile bottom tabs (Plan, Recipes, Pantry, List, Me), desktop slim top nav. Core actions within two taps.
- **Accessibility:** visible focus, 44 px targets, labelled controls, aria-live for list changes, semantic headings, AA contrast in both themes.

### 2.8 PWA and offline

- Installable manifest, maskable icons, standalone display, themed status bar.
- Service worker caches the app shell and static assets; catalog API uses network-first with cache fallback; device data is always available.
- Offline banner explains that new imports and availability votes need a connection.
- Shopping list and plan remain usable offline.

### 2.9 Security and privacy

- No login, no PII, no coordinates stored. Pincode only.
- IPs are hashed with a rotating salt for rate limiting; raw IPs are never logged or stored.
- All API inputs validated with Zod server-side. URL import blocks non-http(s), private/loopback addresses, oversized responses and slow origins (SSRF-safe fetch).
- Confirmation voting is rate limited per IP and per pincode/store; no free-text PII.
- Secrets only in server env. `.env.example` documents every variable.
- No third-party logos or impersonated store UI; text labels only.

### 2.10 Testing and quality gates

- **Unit (Vitest):** unit conversion, list merging, pantry subtraction, nutrition, cost, retrieval filtering/ranking, planner, JSON-LD parsing, store links, rate limiter.
- **E2E (Playwright):** onboarding → generate plan → shopping list.
- **Every milestone gate:** `lint`, `typecheck`, unit tests, build where relevant, then a commit.
- **Final:** Lighthouse mobile 90+ for performance, accessibility and best practices; keyboard-only pass; both themes.

### 2.11 Deployment

- **Local:** `DATABASE_URL=file:local.db`, run migrations, seed, `next dev`.
- **Production:** Vercel + Turso. `DATABASE_URL`/`DATABASE_AUTH_TOKEN` in Vercel env; migrations and seed run once from CI or locally against Turso.
- Rate limiting is in-memory per instance in v1; documented limitation with a path to a shared store.
- Imported recipes never touch the server catalog, so the deployed DB stays read-only for users.

---

## 3. Folder structure

```text
snackers-pit-stop/
├─ PLAN.md
├─ PROGRESS.md
├─ PROMPT.md
├─ README.md
├─ .env.example
├─ components.json
├─ drizzle.config.ts
├─ next.config.ts
├─ playwright.config.ts
├─ vitest.config.ts
├─ tsconfig.json
├─ public/
│  ├─ icons/                    # 192, 512, maskable
│  ├─ manifest.webmanifest
│  └─ og.png
├─ drizzle/                     # generated migrations + meta
├─ scripts/
│  ├─ seed.ts
│  └─ seed-data/
│     ├─ ingredients.ts
│     ├─ stores.ts
│     └─ recipes/
│        ├─ breakfast.ts
│        ├─ veg.ts
│        ├─ nonveg.ts
│        ├─ vegan.ts
│        └─ snacks.ts
├─ src/
│  ├─ app/
│  │  ├─ layout.tsx
│  │  ├─ page.tsx               # landing
│  │  ├─ globals.css
│  │  ├─ manifest.ts
│  │  ├─ error.tsx
│  │  ├─ not-found.tsx
│  │  ├─ onboarding/page.tsx
│  │  ├─ (app)/
│  │  │  ├─ layout.tsx          # shell: top nav + bottom tabs
│  │  │  ├─ plan/page.tsx
│  │  │  ├─ recipes/page.tsx
│  │  │  ├─ recipes/[slug]/page.tsx
│  │  │  ├─ recipes/local/[id]/page.tsx
│  │  │  ├─ pantry/page.tsx
│  │  │  ├─ list/page.tsx
│  │  │  └─ me/page.tsx
│  │  └─ api/
│  │     ├─ recipes/route.ts
│  │     ├─ recipes/[slug]/route.ts
│  │     ├─ recipes/recommend/route.ts
│  │     ├─ import/url/route.ts
│  │     ├─ import/photo/route.ts
│  │     ├─ geo/reverse/route.ts
│  │     ├─ stores/route.ts
│  │     └─ stores/confirm/route.ts
│  ├─ components/
│  │  ├─ ui/                    # shadcn primitives
│  │  ├─ layout/                # app-shell, top-nav, bottom-tabs, theme-toggle
│  │  ├─ landing/               # hero, how-it-works, features, privacy, footer
│  │  ├─ motion/                # page-reveal, stagger, card-lift
│  │  ├─ onboarding/            # wizard, steps/
│  │  ├─ planner/               # week-grid, meal-card, swap-sheet, budget-gauge, day-summary
│  │  ├─ recipes/               # recipe-card, filters, detail, scale-control, import-dialog, review-form
│  │  ├─ pantry/                # pantry-list, add-item-sheet, use-it-up
│  │  ├─ shopping-list/         # list-view, list-item, share-actions, store-handoff
│  │  ├─ stores/                # store-picker, availability-toggle, pincode-field
│  │  └─ common/                # empty-state, error-state, skeletons, section-heading
│  ├─ server/
│  │  ├─ db/
│  │  │  ├─ client.ts
│  │  │  ├─ schema.ts
│  │  │  └─ queries/            # recipes.ts, ingredients.ts, stores.ts
│  │  ├─ retrieval/             # index.ts, filters.ts, rank.ts, embeddings.ts
│  │  ├─ llm/                   # provider.ts, json.ts, prompts.ts, vision.ts
│  │  ├─ geo/                   # provider.ts, nominatim.ts
│  │  └─ rate-limit.ts
│  ├─ client/
│  │  ├─ db/                    # dexie.ts, repos/
│  │  ├─ hooks/                 # use-profile, use-plan, use-pantry, use-list, use-stores
│  │  └─ queries/               # query-client.ts, use-recipes.ts, use-store-availability.ts
│  ├─ lib/
│  │  ├─ schemas/               # profile, recipe, ingredient, plan, shopping-list, store, api
│  │  ├─ nutrition.ts
│  │  ├─ units.ts
│  │  ├─ cost.ts
│  │  ├─ planner.ts
│  │  ├─ shopping-list.ts
│  │  ├─ store-links.ts
│  │  ├─ env.ts
│  │  ├─ constants.ts
│  │  └─ utils.ts
│  └─ types/
└─ tests/
   ├─ unit/                     # units, list, nutrition, retrieval, planner, jsonld, links, rate-limit
   └─ e2e/smoke.spec.ts
```

---

## 4. Data model

### 4.1 Server tables (Drizzle + SQLite/libSQL)

**`ingredients`** — canonical ingredient + nutrition + default price.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | Slug, e.g. `toor-dal` |
| `name` | text, unique, not null | Display name |
| `aliases` | text (JSON `string[]`) | Merge/search aliases |
| `aisle` | text | `produce`, `dairy`, `staples`, `spices`, `protein`, `bakery`, `other` |
| `base_unit` | text | `g`, `ml`, `piece` |
| `piece_grams` | real, nullable | Required when `base_unit = 'piece'` |
| `kcal_per_100` | real | Per 100 g or 100 ml |
| `protein_g_per_100` | real | Default 0 |
| `carbs_g_per_100` | real | Default 0 |
| `fat_g_per_100` | real | Default 0 |
| `fiber_g_per_100` | real | Default 0 |
| `sodium_mg_per_100` | real | Default 0 |
| `default_price_inr` | real | Per `price_basis` |
| `price_basis` | text | `100g`, `100ml`, `piece` |
| `diet_tags` | text (JSON) | `vegan`, `veg`, `eggetarian`, `nonveg` |
| `allergen_tags` | text (JSON) | `gluten`, `dairy`, `nuts`, `peanut`, `soy`, `egg`, `fish`, `shellfish`, `sesame` |
| `is_staple` | integer bool | Staples assumed on hand |
| `created_at` | integer | Epoch ms |

Indexes: `name`, `aisle`, `is_staple`.

**`recipes`** — shared catalog, read-only at runtime.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | Nanoid |
| `slug` | text, unique | URL key |
| `title` | text | |
| `description` | text | One or two lines |
| `cuisine` | text | e.g. Indian, Bengali, South Indian |
| `diet` | text | `vegan`, `veg`, `eggetarian`, `nonveg` |
| `meal_slots` | text (JSON) | `breakfast`, `lunch`, `snack`, `dinner` |
| `servings` | integer | Base servings |
| `prep_min` | integer | |
| `cook_min` | integer | |
| `steps` | text (JSON `string[]`) | Ordered instructions |
| `image_url` | text, nullable | Optional |
| `source_url` | text, nullable | Attribution |
| `source_type` | text | `seed`, `url`, `photo`, `llm` |
| `allergens` | text (JSON) | Union of ingredient allergens |
| `tags` | text (JSON) | `budget`, `high-protein`, `one-pot`, etc. |
| `created_at` | integer | |

Indexes: `slug`, `diet`, `cuisine`.

**`recipe_ingredients`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer PK autoincrement | |
| `recipe_id` | text FK → recipes.id | Cascade delete |
| `ingredient_id` | text FK → ingredients.id, nullable | Set null on delete |
| `raw_name` | text | As written in the recipe |
| `quantity` | real | > 0 |
| `unit` | text | Enum |
| `grams` | real, nullable | Normalized mass/volume/piece-grams |
| `optional` | integer bool | |
| `sort_order` | integer | Unique per recipe |

Unique: `(recipe_id, sort_order)`.

**`stores`**

| Column | Type | Notes |
| --- | --- | --- |
| `id` | text PK | `blinkit`, `zepto`, `instamart`, `apna-mart`, `local-kirana` |
| `name` | text | Text label only |
| `type` | text | `quick_commerce`, `grocery`, `local` |
| `link_template` | text, nullable | Contains `{query}` |
| `sort_order` | integer | |

**`pincode_stores`**

| Column | Type | Notes |
| --- | --- | --- |
| `pincode` | text | 6 digits |
| `store_id` | text FK → stores.id | |
| `confirmed_count` | integer | Default 0 |
| `last_confirmed_at` | integer, nullable | |

PK: `(pincode, store_id)`. Index: `pincode`.

**`store_confirmations`** — audit + rate limiting, no PII.

| Column | Type | Notes |
| --- | --- | --- |
| `id` | integer PK autoincrement | |
| `pincode` | text | |
| `store_id` | text | |
| `ip_hash` | text | Salted hash only |
| `created_at` | integer | |

Indexes: `(pincode, store_id, created_at)`, `(ip_hash, created_at)`.

**`recipe_fts`** — FTS5 virtual table.

Columns: `recipe_id UNINDEXED`, `title`, `description`, `tags`, `ingredients`. Rebuilt by the seed script; queried with `bm25`. The server catalog is seed-only, so no runtime sync triggers are required.

### 4.2 Device tables (Dexie)

| Table | Key | Fields |
| --- | --- | --- |
| `profile` | `id = 'me'` | diet, servings, calorieGoal, weeklyBudgetInr, allergens[], dislikes[], pincode?, storeIds[], customStoreName?, onboardedAt, updatedAt |
| `pantryItems` | `id` (uuid) | ingredientId?, name, normalizedName, quantity, unit, isStaple, createdAt, updatedAt |
| `plans` | `id` | weekStart (`YYYY-MM-DD`, Monday), createdAt, updatedAt |
| `planMeals` | `id` | planId, dayIndex (0–6), slot, recipeId, recipeSource (`catalog`/`local`), servings, locked, sortOrder |
| `savedRecipes` | `id` | slug?, recipe (full JSON), sourceUrl?, sourceType, importedAt |
| `priceOverrides` | `ingredientId` | priceInr, priceBasis, updatedAt |
| `shoppingListState` | `planId` | checkedKeys[], customItems[], removedKeys[], includeStaples, updatedAt |
| `userStores` | `storeId` | customName?, selected, confirmedByUser, updatedAt |
| `settings` | `key` | value (theme, lastPincode, hasOnboarded, activePlanId) |

Indexes: `pantryItems.normalizedName`, `pantryItems.ingredientId`, `plans.weekStart`, `planMeals.[planId+dayIndex+slot]`, `planMeals.recipeId`, `savedRecipes.importedAt`.

### 4.3 Shared Zod schemas

- `DietType`, `MealSlot`, `Unit`, `Aisle`, `StoreType`
- `IngredientSchema`, `RecipeIngredientSchema`, `RecipeSchema`, `RecipeSummarySchema`
- `RecipeDraftSchema` (import result, review required)
- `ProfileSchema`, `PantryItemSchema`, `PlanSchema`, `PlanMealSchema`
- `ShoppingItemSchema`, `ShoppingListSchema`
- `StoreSchema`, `StoreAvailabilitySchema`, `ConfirmationSchema`
- API request/response schemas for every route
- `EnvSchema` (server only)

### 4.4 Invariants

- Quantities > 0; servings 1–20; calories 1200–4000; weekly budget ₹500–₹50,000.
- Pincode is exactly 6 digits and starts 1–9.
- A recipe ingredient either links to an ingredient or keeps `raw_name` and `grams = null`; missing data is flagged, never guessed silently.
- Plan meals reference either a catalog slug/id or a local saved recipe id.
- Shopping item keys are deterministic (`slug(normalizedName) + ':' + baseUnit`) so check-off survives regeneration.
- All money is INR numbers rounded for display; all nutrition labels say "estimate".
- User store selection always overrides crowdsourced availability.

---

## 5. API surface

| Method | Route | Purpose | Protection |
| --- | --- | --- | --- |
| GET | `/api/recipes` | Search/filter catalog | Zod query, cache |
| GET | `/api/recipes/[slug]` | Recipe detail | Zod params, cache |
| POST | `/api/recipes/recommend` | Ranked pool for planner | Zod body, IP limit |
| POST | `/api/import/url` | Import recipe from link | Zod, SSRF-safe fetch, IP limit |
| POST | `/api/import/photo` | Import recipe from image | Multipart limits, IP limit |
| POST | `/api/geo/reverse` | Coordinates → pincode | Zod, IP limit |
| GET | `/api/stores?pincode=` | Store availability | Zod query |
| POST | `/api/stores/confirm` | Vote store works here | Zod, IP + pincode limit |

`/api/recipes/recommend` accepts filters and pantry names only; no profile is persisted server-side.

---

## 6. Milestones

| Milestone | Scope | Tasks |
| --- | --- | --- |
| M0 | Planning docs | 1 |
| M1 (a) | Scaffold, design system, landing | 2–12 |
| M2 (b) | Data model, seed data, retrieval | 13–47 |
| M3 (c) | Onboarding and planner | 48–65 |
| M4 (d) | Import flows | 66–79 |
| M5 (e) | Pantry and shopping list | 80–91 |
| M6 (f) | Location and stores | 92–99 |
| M7 (g) | Polish, tests, PWA, README | 100–109 |

Commit after every gate with the message listed in the task. Never commit with failing lint, typecheck, or tests.

---

## 7. Task list (109 tasks, ~15 minutes each)

### M0 — Planning

1. **Write PLAN.md and PROGRESS.md.** Architecture, folder structure, data model, and a 15-minute task list. *(done)*

### M1 — Scaffold, design system, landing

2. **Scaffold the app.** Create the Next.js App Router project with TypeScript strict, ESLint, Prettier, `src/`, `@/*` alias, and scripts for dev/build/lint/typecheck/test.
3. **Set up design tokens.** Tailwind + `globals.css` with cream/forest/saffron/tomato CSS variables for light and dark, radii, shadows, and Fraunces + DM Sans via `next/font`.
4. **Install shadcn/ui.** Init `components.json` and add button, card, input, label, textarea, select, checkbox, switch, tabs, dialog, sheet, dropdown-menu, badge, skeleton, progress, separator, tooltip, sonner.
5. **Add theming.** `next-themes` provider, no-flash script, theme toggle, and system/light/dark persistence.
6. **Build the app shell.** Root layout metadata/viewport, skip link, desktop top nav, mobile bottom tab bar, and stub routes for Plan, Recipes, Pantry, List, Me, Onboarding.
7. **Add motion primitives.** `PageReveal`, `StaggerList`, `CardLift`, and a reduced-motion hook; cap app-screen animations at 400 ms.
8. **Build the landing hero.** Headline, subcopy, CTAs, and a lightweight animated pit-stop/checkered-flag motif that respects reduced motion.
9. **Build landing sections.** Three-step "how it works", feature cards, and the "free, private, no signup" band.
10. **Finish the landing page.** Footer, final CTA, scroll reveals, responsive polish, and accessible landmarks/headings.
11. **Audit landing quality.** Keyboard pass, contrast check, font/image weight, and fix what the audit finds.
12. **Gate M1.** Run lint, typecheck, and build; smoke-check mobile and desktop; commit `feat: scaffold, design system, and landing page`.

### M2 — Data model, seed data, retrieval

13. **Add env handling.** Zod-validated `src/lib/env.ts`, `.env.example`, and clear errors for missing server vars.
14. **Wire the database.** Drizzle + `@libsql/client` with a local file URL in dev and Turso in prod; `drizzle.config.ts` and db scripts.
15. **Model ingredients.** Drizzle table with nutrition per 100 g/ml, default INR price, aisle, base unit, diet/allergen tags, and staple flag.
16. **Model recipes.** `recipes` and `recipe_ingredients` tables with diet, slots, servings, steps, source metadata, and normalized grams.
17. **Model stores.** `stores`, `pincode_stores`, and `store_confirmations` tables with indexes and no PII.
18. **Add migrations + FTS5.** Generate the initial migration, create the `recipe_fts` virtual table, and add a rebuild step to the seed pipeline.
19. **Seed ingredients 1/4.** ~40 staples: grains, dals, flours, rice, oats and pasta with per-100 g nutrition and prices.
20. **Seed ingredients 2/4.** ~40 produce and dairy items with aisle, unit, nutrition, and prices.
21. **Seed ingredients 3/4.** ~40 spices, oils, condiments and aromatics with realistic small-unit prices.
22. **Seed ingredients 4/4.** ~30 proteins, eggs, nuts and packaged items; add a seed test for unique ids and sane values.
23. **Seed recipes 1/13.** Five budget breakfasts (poha, upma, besan chilla, masala oats, veg sandwich) with structured ingredients and steps.
24. **Seed recipes 2/13.** Five breakfasts (aloo paratha, idli-sambar, egg bhurji toast, rava dosa, thepla).
25. **Seed recipes 3/13.** Five veg lunch/dinner dishes (dal tadka rice, rajma chawal, chole roti, mixed veg sabzi, curd rice).
26. **Seed recipes 4/13.** Five veg dishes (palak paneer, aloo gobi, bhindi masala, lauki dal, veg pulao).
27. **Seed recipes 5/13.** Five veg dishes (paneer bhurji, baingan bharta, cabbage poriyal, budget dal makhani, tomato rice).
28. **Seed recipes 6/13.** Five eggetarian dishes (egg curry, egg fried rice, egg roast, omelette wrap, egg chaat).
29. **Seed recipes 7/13.** Five non-veg dishes (chicken curry, chicken keema, fish curry, chicken stew, chilli chicken).
30. **Seed recipes 8/13.** Five non-veg dishes (chicken biryani, butter chicken, fish fry, chicken salad, keema pav).
31. **Seed recipes 9/13.** Five vegan dishes (chana masala, tofu bhurji, vegetable khichdi, peanut chutney rice, dal palak).
32. **Seed recipes 10/13.** Five vegan dishes (sambar rice, lemon rice, coconut vegetable curry, chole palak, roasted veg wrap).
33. **Seed recipes 11/13.** Five one-pot/rice dishes (veg biryani, jeera rice dal, masala khichdi, tomato bath, curd rice bowl).
34. **Seed recipes 12/13.** Five snacks (onion pakora, dhokla, bhel, grilled sandwich, fruit chaat).
35. **Seed recipes 13/13.** Five regional/high-protein dishes (litti chokha, cholar dal, soya chunk curry, sprout salad, paneer tikka bowl); add a recipe integrity test.
36. **Seed stores + pincodes.** Blinkit, Zepto, Instamart, Apna Mart and local kirana, plus Asansol pincode rows marked unverified.
37. **Define shared Zod schemas.** Profile, ingredient, recipe, recipe draft, plan, shopping list, store and API schemas with inferred types.
38. **Build server repositories.** Recipe list/detail/filter, ingredient lookup, store-by-pincode, and confirmation queries.
39. **Implement nutrition math.** Per-100 g/ml → serving calories/macros with rounding and estimate flags; unit tests.
40. **Implement unit conversion.** g/kg, ml/l, tsp/tbsp/cup, piece↔grams; reject incompatible families; unit tests.
41. **Implement cost math.** Ingredient price × normalized quantity, per recipe and per serving; unit tests.
42. **Build retrieval filters.** Hard filter by diet, allergens and dislikes in SQL behind a typed `RecipeRetriever` interface.
43. **Add ranking.** FTS5 bm25 + pantry-overlap score + variety signal, returning a score breakdown and reasons.
44. **Add embeddings flag.** `EmbeddingRanker` behind `EMBEDDINGS_ENABLED=false`; no network calls while disabled.
45. **Test retrieval.** Filtering correctness, allergen exclusion, pantry-first ordering, and empty-query behavior.
46. **Add recipe endpoints.** `GET /api/recipes` and `GET /api/recipes/[slug]` with validated params and cache headers.
47. **Gate M2.** Migrate, seed, run lint/typecheck/tests, verify FTS results; commit `feat: data model, seed catalog, and retrieval`.

### M3 — Onboarding and planner

48. **Set up Dexie.** Versioned IndexedDB schema for profile, pantry, plans, meals, imports, price overrides, list state, stores and settings.
49. **Add client repositories.** Typed CRUD and React hooks for profile, pantry, plans, imports and stores using live queries.
50. **Build the onboarding shell.** Four steps, progress indicator, skip/resume, and redirect rules based on `onboardedAt`.
51. **Step 1: diet.** Diet type and household servings with accessible radio cards.
52. **Step 2: goals.** Calorie goal and weekly INR budget with validation and sensible defaults.
53. **Step 3: preferences.** Allergen and dislike chips with custom entry and a best-effort filtering note.
54. **Step 4: location + stores.** Manual pincode for now (geo arrives in M6) plus store selection; finishing saves the profile and routes to Plan.
55. **Add profile summary.** Me page shows diet, goals, budget, allergens, pincode and stores, with edit links back into onboarding.
56. **Write the planner algorithm.** Deterministic seeded selection across 7 days × 4 slots with calorie targets, budget cap, variety and locks as pure functions.
57. **Test the planner.** Locks respected, no repeats, calorie/budget bounds, and deterministic output for the same seed.
58. **Add the recommend endpoint.** `POST /api/recipes/recommend` validates filters/pantry, rate-limits, and returns a ranked pool.
59. **Build the planner page.** 7-day grid with meal cards, skeletons, an empty state, and a "Generate plan" action.
60. **Add day and week meters.** Per-day calories/cost plus a fuel-gauge weekly budget meter with accessible values.
61. **Add meal swap.** Bottom sheet with ranked alternatives, nutrition/cost preview, and one-tap replace.
62. **Add meal lock + regenerate.** Lock/unlock meals and regenerate the rest without touching locked slots.
63. **Add drag reorder.** dnd-kit drag between slots/days with layout animation and keyboard support.
64. **Persist and navigate weeks.** Save plans/meals in Dexie, add prev/current/next week switching and "copy last week".
65. **Gate M3.** Lint, typecheck, unit tests, and a manual onboarding→plan pass; commit `feat: onboarding and weekly planner`.

### M4 — Import flows

66. **Build the LLM wrapper.** Provider-agnostic chat/vision client from env with timeouts, token caps and typed errors.
67. **Add strict JSON generation.** Zod-validated output with exactly one repair retry; test invalid→valid.
68. **Add IP rate limiting.** Hashed-IP sliding window utility with per-route limits and tests; apply it to all LLM/import routes.
69. **Build safe URL fetching.** http/https only, private-IP blocking, 8 s timeout, 2 MB cap, content-type checks, and tests.
70. **Parse schema.org JSON-LD.** Extract Recipe objects, map fields/ingredients/units, and test messy real-world shapes.
71. **Add the URL import route.** `POST /api/import/url` uses JSON-LD first and the LLM only as fallback, returning a validated draft.
72. **Write the extraction prompt.** Strict JSON recipe schema, no invented nutrition or prices, source attribution, and refusal rules.
73. **Add photo import.** `POST /api/import/photo` with image type/size validation and a vision model returning the same draft schema.
74. **Build the import review form.** Editable title, servings, ingredients, units, steps, diet/allergen tags and source link.
75. **Save imports locally.** Persist to Dexie, list under "My imports", support delete, and render a local recipe detail route.
76. **Build recipe browsing.** Search, diet/allergen filters, sort, limit, cards and skeletons.
77. **Build recipe detail.** Servings scaling, computed nutrition/cost estimates, add-to-plan, and source link.
78. **Polish import UX.** Entry points, progress, validation errors, retry, and "review before saving" messaging.
79. **Gate M4.** Lint, typecheck, tests, and a manual URL/photo import; commit `feat: recipe import from URL and photo`.

### M5 — Pantry and shopping list

80. **Build pantry CRUD.** Add/edit/delete items with quantity, unit and staple toggle; persist in Dexie.
81. **Polish pantry.** Search/sort, empty state, and quick-add suggestions from seeded ingredients.
82. **Add "use it up".** Rank recipes by pantry overlap and surface them on Pantry with reasons.
83. **Normalize and merge ingredients.** Alias mapping, canonical units and merge rules; unit tests.
84. **Build the shopping list generator.** Scale plan ingredients, merge, convert/combine units, and test edge cases.
85. **Subtract pantry.** Handle full and partial quantities, staples policy, and tests.
86. **Group by aisle.** Stable aisle order, manual reorder, and collapsed sections.
87. **Build the list page.** Generate from the active plan, show grouped items/counts, and handle the no-plan state.
88. **Add check-off.** Animated check with strike-through, persisted state, reset, and aria-live updates.
89. **Add copy/share.** Web Share API with WhatsApp-friendly plain text and a clipboard fallback.
90. **Add store handoff.** Per-ingredient and whole-list open-and-search links from templates with copy fallback; tests.
91. **Gate M5.** Lint, typecheck, tests, and a manual plan→list pass; commit `feat: pantry and merged shopping list`.

### M6 — Location and stores

92. **Build the geo interface.** Swappable provider + Nominatim reverse geocoder honoring the UA policy and 1 req/s, with manual pincode fallback.
93. **Add the reverse-geocode route.** `POST /api/geo/reverse` validates coordinates and returns only pincode/city/state; tests.
94. **Add location UX.** "Use my location" with permission/denied/timeout states; store the pincode only, never coordinates.
95. **Add the stores API.** `GET /api/stores?pincode=` returns seeded stores with confirmed/unconfirmed status and counts.
96. **Build the store picker.** Toggles, "Do you use this here?", custom kirana rename, and the crowdsourcing note.
97. **Add confirmation voting.** `POST /api/stores/confirm` with IP-hash rate limits, count increment, and tests.
98. **Integrate stores.** Use selections in onboarding and list handoff; the user's selection always wins.
99. **Gate M6.** Lint, typecheck, tests, and a manual pincode flow; commit `feat: location and store availability`.

### M7 — Polish, tests, PWA, README

100. **Add the PWA manifest.** Name, icons (192/512/maskable), theme colors, standalone display, and install metadata.
101. **Add the service worker.** Serwist offline shell, static caching, network-first API fallback, and an offline banner.
102. **Accessibility audit.** Keyboard paths, focus-visible, labels/aria, heading order, live regions, and contrast fixes.
103. **Dark mode audit.** Every screen, gauge, skeleton and toast; fix token misuse.
104. **Motion audit.** Reduced-motion coverage, 400 ms cap on app screens, no layout jank, and skeleton timing.
105. **Performance pass.** Font/image optimization, bundle trimming, route-level code splitting, and Lighthouse 90+ on mobile.
106. **Polish states.** Consistent skeletons, empty states, error boundaries, toasts, and retry actions.
107. **Add the Playwright smoke test.** Onboarding → generate plan → shopping list against a seeded local DB.
108. **Write the README.** Setup, env vars, Vercel + Turso deploy, assumptions, limitations, disclaimers, and roadmap.
109. **Final gate.** Lint, typecheck, all tests, build, Lighthouse and smoke test; commit `chore: polish, tests, PWA, and docs`.

# Snackers Pit Stop

A free, mobile-first meal-planning PWA for students and young professionals in India. Pick a diet, calorie goal, weekly budget and the stores you actually use; generate a week of meals; then take one merged shopping list to the checkout.

No account, no paywall, no ads. Your plan and pantry stay in this browser on this device.

---

## Highlights

- Four-step onboarding (diet, goals, preferences, pincode/stores), skippable and editable later.
- Deterministic weekly planner: 7 days × breakfast/lunch/snack/dinner, with swap, lock and drag-to-reorder.
- Fuel-gauge budget and calorie summaries, calculated in code from a seeded ingredient table.
- Recipe catalog with diet/allergen filters, search, scaling and source links.
- URL import via schema.org JSON-LD first, with a provider-agnostic LLM fallback for pages without structured data.
- Pantry and staples subtraction, unit-aware merged shopping list, check-off, copy/share, and per-store search handoff.
- Installable PWA with an offline shell, cached catalog fallbacks and an offline banner.
- Designed light and dark themes, reduced-motion support, keyboard paths and labelled controls.

---

## Stack

| Concern      | Choice                                                     |
| ------------ | ---------------------------------------------------------- |
| Framework    | Next.js 16 App Router, React 19, strict TypeScript         |
| Styling      | Tailwind CSS 4, CSS variables, shadcn/ui primitives        |
| Motion       | Framer Motion, reduced-motion aware                        |
| Shared data  | Drizzle ORM + libSQL/SQLite (local file, Turso-compatible) |
| Device data  | Dexie 4 on IndexedDB                                       |
| Server cache | TanStack Query                                             |
| Validation   | Zod on env, API boundaries, forms and stored shapes        |
| Tests        | Vitest (unit), Playwright (one smoke flow)                 |
| PWA          | Web manifest + Serwist service worker                      |

---

## Requirements

- Node.js 20.9+ (Node 22 LTS recommended) and npm.
- A Chromium browser for the Playwright smoke test (`npx playwright install chromium` once).
- Optional: [Turso CLI](https://docs.turso.tech/cli/introduction) and a Turso account for production deployment.

No API keys or database credentials are needed for local development. The app defaults to `file:local.db` and works without an LLM provider.

---

## Local setup

```bash
npm install
npm run db:migrate
npm run db:seed
npm run dev
```

Open <http://localhost:3000>. The seed loads ~141 ingredients, 65 budget-friendly recipes (mostly Indian home cooking), five store labels and unverified availability rows for Asansol pincodes. `npm run db:seed` is destructive: it replaces catalog tables and resets confirmation counts, so do not run it against production after users start voting.

`npm run dev` starts both the Next.js dev server and the Serwist watcher. The service worker is disabled in development; run `npm run build && npm run start` to exercise the PWA.

### Environment files

Defaults are safe, so no env file is required for a fresh local checkout. When overriding values:

- Next.js reads `.env.local`.
- `drizzle-kit` and `scripts/seed.ts` read `.env` via `dotenv/config`.
- Exporting the variables in the shell works for both (see the deployment commands below).

Copy `.env.example` to whichever file suits your workflow and never commit secrets. See [Environment variables](#environment-variables) for the full list.

### Useful scripts

| Script                                    | What it does                                            |
| ----------------------------------------- | ------------------------------------------------------- |
| `npm run dev`                             | Next.js dev server + Serwist watcher                    |
| `npm run build`                           | Production build, then generates `public/sw.js`         |
| `npm run start`                           | Serve the production build                              |
| `npm run lint`                            | ESLint                                                  |
| `npm run typecheck`                       | Route type generation + `tsc --noEmit`                  |
| `npm test`                                | Vitest unit suite                                       |
| `npm run test:e2e`                        | Playwright smoke test (seeds DB, starts a local server) |
| `npm run test:e2e:ui`                     | Playwright interactive runner                           |
| `npm run format` / `npm run format:check` | Prettier                                                |
| `npm run db:generate`                     | Generate a migration after schema edits                 |
| `npm run db:migrate`                      | Apply migrations                                        |
| `npm run db:seed`                         | Replace the shared catalog with seed data               |
| `npm run db:studio`                       | Drizzle Studio                                          |

---

## Environment variables

All variables are **server-only**. There are no `NEXT_PUBLIC_*` secrets and no client-side API keys.

| Variable               | Required     | Default                     | Purpose                                                            |
| ---------------------- | ------------ | --------------------------- | ------------------------------------------------------------------ |
| `DATABASE_URL`         | No           | `file:local.db`             | libSQL URL. Use `libsql://…` for Turso.                            |
| `DATABASE_AUTH_TOKEN`  | Turso only   | unset                       | Turso auth token. Leave unset for a local file.                    |
| `LLM_BASE_URL`         | No           | `https://api.openai.com/v1` | Any OpenAI-compatible chat/completions endpoint.                   |
| `LLM_API_KEY`          | Imports only | unset                       | Needed when a URL has no JSON-LD and for photo import.             |
| `LLM_MODEL`            | No           | `gpt-4o-mini`               | Text model for extraction fallbacks.                               |
| `LLM_VISION_MODEL`     | No           | `LLM_MODEL`                 | Vision model for photo import.                                     |
| `LLM_TIMEOUT_MS`       | No           | `30000`                     | Per-request timeout (1,000–120,000 ms).                            |
| `LLM_MAX_TOKENS`       | No           | `2048`                      | Completion cap (256–8,192 tokens).                                 |
| `EMBEDDINGS_ENABLED`   | No           | `false`                     | Experimental embeddings reranker. No network calls while off.      |
| `PHOTO_IMPORT_ENABLED` | No           | `false`                     | Exposes photo import; requires a vision-capable key.               |
| `GEO_PROVIDER`         | No           | `nominatim`                 | Reverse-geocoding provider. Manual pincode always works.           |
| `NOMINATIM_BASE_URL`   | No           | public Nominatim            | Override for a self-hosted instance.                               |
| `NOMINATIM_USER_AGENT` | Production   | fallback UA                 | Descriptive User-Agent with contact details, per Nominatim policy. |
| `RATE_LIMIT_SALT`      | Production   | dev-only value              | Salt for hashed-IP rate limits. Use a long random value.           |

The LLM never computes calories or prices: it only extracts recipe drafts and writes short explanations. Responses are Zod-validated with one repair retry. Every LLM, geocoding and vote endpoint is rate limited per hashed IP.

---

## Tests and quality gates

```bash
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium   # once
npm run test:e2e
```

The Playwright flow migrates and seeds the local DB, opens a fresh browser profile with empty IndexedDB, completes onboarding, generates a plan, opens the shopping list and checks off an item. It uses `http://localhost:3100` and blocks service workers to avoid stale caches. Stop any server already using port 3100 before running it.

The final gate also runs mobile Lighthouse against the production build, targeting **90+** for Performance, Accessibility and Best Practices. Use Chrome/Chromium with:

```bash
npm run build
npm run start
npx lighthouse http://localhost:3000 \
  --only-categories=performance,accessibility,best-practices \
  --chrome-flags="--headless --no-sandbox" \
  --output=json --output-path=./lighthouse-mobile.json --quiet
```

Lighthouse defaults to a mobile emulation profile. Scores vary by machine; run on a quiet local build for representative results. The public landing route is a self-contained static page rewritten from `/` in `next.config.ts`; the app routes keep the full client runtime. On the reference local run it scored 100 Performance / 100 Accessibility / 100 Best Practices with no console errors.

---

## Deploying to Vercel + Turso (free tiers)

1. **Create the database.**

   ```bash
   turso db create snackers-pit-stop
   turso db show snackers-pit-stop --url      # copy as DATABASE_URL
   turso db tokens create snackers-pit-stop   # copy as DATABASE_AUTH_TOKEN
   ```

2. **Set Vercel environment variables** in Project Settings → Environment Variables for Production and Preview:
   - `DATABASE_URL` = the `libsql://…` URL
   - `DATABASE_AUTH_TOKEN` = the token
   - `RATE_LIMIT_SALT` = a long random string, e.g. `openssl rand -hex 32`
   - `LLM_BASE_URL`, `LLM_API_KEY`, `LLM_MODEL` (and optionally `LLM_VISION_MODEL`) if you want URL/photo imports
   - `PHOTO_IMPORT_ENABLED=true` only if photo import is wanted
   - `NOMINATIM_USER_AGENT` with a real contact, if "Use my location" is enabled in production
   - `EMBEDDINGS_ENABLED=true` only when an embeddings-compatible provider is configured

3. **Migrate and seed once** from your local machine, pointing the scripts at Turso. On macOS/Linux:

   ```bash
   DATABASE_URL="libsql://…" DATABASE_AUTH_TOKEN="…" npm run db:migrate
   DATABASE_URL="libsql://…" DATABASE_AUTH_TOKEN="…" npm run db:seed
   ```

   In PowerShell, set `$env:DATABASE_URL` and `$env:DATABASE_AUTH_TOKEN` first, then run the same two scripts. The seed replaces catalog rows; run it before voting begins and never on every deploy.

4. **Import the Git repository in Vercel.** Framework detection should select Next.js. Keep the default build command `npm run build` — it already runs Next and the Serwist CLI. Deploy, then check `/`, `/plan`, `/manifest.webmanifest` and a fresh install of the PWA.

5. **Verify.** On a phone, install from the browser menu, go offline, and confirm the shell, saved plan and shopping list still open. New imports and availability votes need a connection.

User data is never sent to the server, so the production database stays a read-only shared catalog plus anonymous availability votes.

---

## Architecture and data ownership

- **Server (SQLite/libSQL):** ingredients with nutrition and default INR prices, shared recipes, FTS index, stores, pincode availability, anonymous confirmation audit rows.
- **Device (IndexedDB/Dexie):** profile, pantry, plans, plan meals, imported recipes, price overrides, list check-off state, selected stores and settings.
- **Computed in code:** calories/macros from per-100 g/ml data, INR cost from seeded or overridden prices, unit conversion, list merging and pantry subtraction. No runtime scraping of nutrition or prices.
- **Retrieval:** hard diet/allergen/dislike filters, FTS5 relevance, pantry overlap and variety scoring; embeddings reranker is opt-in and off by default.
- **Planner:** pure, seeded function on the device. An LLM never decides meals, calories or cost.

Key entry points: `src/app/` (routes), `src/components/` (UI), `src/server/` (DB, retrieval, LLM, geo, rate limits), `src/client/` (Dexie repos and hooks), `src/lib/` (schemas and pure computations), `scripts/` (seed pipeline), `tests/unit/` and `tests/e2e/`.

---

## Assumptions

- One device, one local profile, no login and no cross-device sync in v1.
- Four meal slots; household servings scale the shopping list, not the plan grid.
- English UI, Indian dish names, metric units, INR prices, Monday-start weeks.
- Catalog recipes are shared and read-only at runtime; imported recipes stay on the device.
- Location is requested only on tap. Coordinates are used transiently and never stored; only the pincode is saved.
- Unknown pincodes show all seeded stores as unconfirmed. The user's own picks always win, including a renameable "Other local kirana".
- Store integration is handoff only: text labels, search links, copy/share. No scraping, private APIs, logins or ordering.

---

## Known limitations

- Clearing browser storage deletes the profile, pantry, plans and imports. The JSON export/import in **Me** is the only backup path.
- Rate limits are in-memory per server instance. On serverless with many instances, a shared store (for example Redis or a Turso table) is needed for global limits.
- Asansol pincode availability is unverified seed data. Other pincodes start with no confirmation rows; counts grow only through crowdsourced votes.
- Store search link templates must be verified per store and can change without notice.
- Nutrition and price figures are estimates. Allergen tags and imported recipe data can be incomplete or wrong.
- LLM imports require a configured key; photo import is off by default. Extracted drafts always require user review.
- Offline mode serves cached app assets, earlier catalog responses and device data. New imports, votes and reverse geocoding need a connection.
- The v1 catalog is seed-only; there is no user publishing, moderation or live price feed.
- The public landing page is a static HTML file with inline theme/offline scripts; it intentionally omits the React hero scene to keep the mobile critical path small.

---

## Disclaimers

Snackers Pit Stop is **not medical advice**. Follow your clinician for medical or clinical nutrition needs. Treat calories, macros and prices as rough estimates, check packaged-food labels and your final bill, and never rely on the app for an allergy decision. Store names are plain text only; the project is not affiliated with or endorsed by any listed store. See the in-app [About & disclaimers](/about) page for the full wording.

---

## Roadmap

- Shared, durable rate limiting and abuse monitoring across serverless instances.
- Verified pincode coverage with moderation for crowdsourced store availability.
- More seed recipes, regional price sets and user-contributed price corrections.
- Optional encrypted account sync with explicit opt-in, while keeping anonymous local use.
- Evaluate the opt-in embeddings ranker and add an offline queue for recipe imports.
- Additional verified store handoff templates and deeper keyboard/share polish.

---

## License and attribution

Personal project built for the prompt's product brief. Recipe data is seeded locally; imported recipes keep their source URL where available. Third-party store names are used descriptively, without logos or copied interfaces.

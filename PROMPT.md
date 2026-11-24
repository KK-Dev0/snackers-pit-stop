ROLE

You are a senior full-stack engineer and professional graphic/UI designer. Build "Snackers Pit Stop", a free, mobile-first meal planning web app (installable PWA). Work autonomously: do not ask me questions. State assumptions in the README and keep going.



PRODUCT

A pit stop for hungry people: plan the week's meals around diet, calories, budget and what is already in the pantry, import recipes from links or photos, and get one merged shopping list that hands off to the quick-commerce and grocery stores available in the user's area. Target users: students and young professionals in India. Free forever for users: no paywall, no ads, no account required.



TECH STACK (use exactly this unless something is impossible)

\- Next.js (App Router) + TypeScript (strict), Tailwind CSS, shadcn/ui, Framer Motion

\- Drizzle ORM + SQLite (libSQL, Turso-compatible) for shared data (recipes, stores, pincode availability)

\- User data (profile, pantry, plans, saved recipes) lives on the device in IndexedDB (Dexie). No login in v1.

\- Zod for every schema. Vitest for unit tests, Playwright for one smoke test.

\- LLM access through a provider-agnostic wrapper (src/lib/llm) configured by env vars. The model must return strict JSON validated by Zod, with one retry on invalid output.



DESIGN DIRECTION (follow closely)

\- Feel: classy, warm, genuine, easy to navigate. A friendly roadside pit-stop motif used lightly (a small checkered-flag accent, a fuel-gauge style progress bar). No clutter, no gimmicks.

\- Palette as CSS variables: warm cream background, deep forest/charcoal text, saffron primary accent, tomato for alerts. Full dark mode that is designed, not just inverted. WCAG AA contrast minimum.

\- Type: an elegant serif for display headings (Fraunces or similar) and a clean sans for UI (Inter or DM Sans). Generous spacing, soft rounded cards, subtle shadows.

\- Motion (Framer Motion, tasteful and fast): staggered page-load reveals, scroll reveals on the landing page, a subtle animated hero, card hover lifts, satisfying check-off animation on the shopping list, smooth layout transitions when meals are rearranged, skeleton loaders. Keep animations under 400ms on app screens. Respect prefers-reduced-motion everywhere. No WebGL, no heavy scroll-jacking, and no paid or unlicensed component packs.

\- Navigation: bottom tab bar on mobile (Plan, Recipes, Pantry, List, Me), a slim top nav on desktop. Maximum two taps to any core action.

\- Use text labels for third-party stores. Do not use their logos or impersonate their UI.



PAGES AND FEATURES

1\. Landing: hero, how it works (3 steps), feature cards, "free, private, no signup" section, footer. This is the only page allowed richer animation.

2\. Onboarding (4 quick steps, skippable): diet type (veg, non-veg, vegan, eggetarian, etc.), calorie goal, weekly budget in INR, allergens/dislikes, location (see below), stores they use.

3\. Weekly Planner: 7 days x meal slots. Generate a plan with one button, swap or lock any meal, drag to reorder. Show per-day calories and estimated cost against the budget with a fuel-gauge style meter.

4\. Recipes: search, filters, detail view with scaling (servings), and Import.

&#x20;  - Import from URL: fetch server-side, parse schema.org Recipe JSON-LD first; fall back to the LLM only if missing.

&#x20;  - Import from photo: vision model to structured recipe.

&#x20;  - Store structured data and the source link. Never copy full article text.

5\. Pantry: add items, mark staples, "use it up" suggestions that prioritise recipes matching pantry items.

6\. Shopping List: merge ingredients across the plan, convert and combine units, subtract pantry, group by aisle, check-off with animation, copy/share via Web Share API (WhatsApp friendly plain text).

7\. Me/Settings: edit profile, stores, data export/import (JSON), clear data, about and disclaimers.



RETRIEVAL (RAG)

\- Create a retrieval module behind an interface. v1: hard-filter by diet and allergens, then rank by pantry ingredient overlap plus SQLite FTS5 text relevance. Add an embeddings-based ranker behind an env flag, off by default.

\- Seed at least 60 realistic, budget-friendly recipes (many Indian home-cooking dishes) with structured ingredients and quantities.

\- The LLM generates or imports recipes and writes explanations only. It never computes calories or prices.



NUTRITION AND PRICES

\- Seed a nutrition table for \~150 common ingredients (per 100 g) and compute calories from it in code. Label all values as estimates.

\- Prices: user-editable rough price per ingredient with sensible seeded defaults. No live price scraping.

\- Add a clear note that this is not medical advice, and that allergen filtering is best-effort so users must check labels.



LOCATION AND STORE AVAILABILITY

\- Ask for location only when the user taps "Use my location" (browser Geolocation API). Reverse geocode to a pincode through a swappable provider (src/lib/geo), honouring that provider's usage policy. Always offer manual pincode entry. Store only the pincode, never coordinates.

\- Tables: stores (id, name, type, link\_template), pincode\_stores (pincode, store\_id, confirmed\_count), plus the user's own selected stores on the device.

\- Seed stores: Blinkit, Zepto, Swiggy Instamart, Apna Mart, plus a generic "Other local kirana" option. Seed availability for Asansol pincodes (verify these in the README, mark as unverified).

\- "Confirm availability" button lets users vote that a store works at their pincode (rate limited, no PII).

\- Handoff only: per ingredient and per list, build open-and-search links from link\_template and provide copy/share. Do NOT scrape, reverse-engineer private APIs, or attempt logins or orders inside the app. Note in the README that link formats must be verified per store.

\- Asansol is only seed data for testing. The app must work for any Indian pincode.

\- If a pincode has no availability data, show all seeded stores as unconfirmed with a "Do you use this here?" toggle, let the user pick the ones they use, and show a friendly note that availability for their area is still being crowdsourced.

\- Never hide stores just because the pincode is unknown. The user's own selection always wins over crowdsourced data.

\- Also add an "Other local kirana" entry the user can rename.



QUALITY BAR

\- Lighthouse 90+ on mobile for performance, accessibility and best practices. Keyboard navigable, proper aria labels, visible focus states.

\- Rate limit all LLM endpoints per IP. Validate all inputs server-side. No secrets in the client. Provide .env.example.

\- Unit tests for: unit conversion, list merging, pantry subtraction, calorie calculation, retrieval filtering. One Playwright test: onboarding to plan to shopping list.

\- Clean folder structure, small components, no dead code.



PROCESS

1\. First write PLAN.md: architecture, data model, milestones. Then build milestone by milestone, committing after each with a clear message.

2\. Milestones: (a) scaffold, design system, landing; (b) data model, seed data, retrieval; (c) onboarding and planner; (d) import flows; (e) pantry and shopping list; (f) location and stores; (g) polish, tests, PWA, README.

3\. Run lint, typecheck and tests before each commit and fix failures.

4\. Finish with a README: setup, env vars, deploy steps for a free tier (Vercel + Turso), assumptions, known limitations, and a short roadmap.


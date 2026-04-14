# Sprint 1 — Sales Funnel Foundation

**Goal:** Get the core storefront architecture working — DB-driven collections, image conventions, and the design tool — so every future feature has a clean place to land.

---

## Completed

- [x] Homepage carousel (static slides for all collections + design tool)
- [x] `FourColorDesignStudio` — canvas-based custom placard designer at `/design`
- [x] Prisma schema — `Collection`, `Item`, `PricingScheme`, `PricingTier` models
- [x] `src/lib/storefront/pricing-config.ts` + `pricing.ts` — tier pricing logic (incl. standalone cover $10)
- [x] `src/lib/inventory-colors.ts` — reads live spool inventory for color availability
- [x] `/api/inventory-colors` — API route exposing available colors to the design tool
- [x] `src/lib/storefront/collections.ts` — DB query helpers + image path helpers + `formatTiers`
- [x] `/collections` — server-rendered grid of all active collections from DB
- [x] `/collections/[slug]` — dynamic server-rendered collection detail page with items grid
- [x] `/public/collections/` folder — slug-based image convention: `{slug}-carousel.png`, `{slug}-product.png`
- [x] `/public/items/` folder — slug-based image convention: `{slug}-hero.png`, `{slug}-assembled.png`, `{slug}-in-use.png`
- [x] `prisma/seed.ts` — 2 schemes, 6 tiers, 5 collections, 176 hero items (run from inventory app)
- [x] Carousel slug mismatches fixed — `/collections/patriot` and `/collections/outdoorsman`
- [x] Navigation header — sticky, hamburger on mobile, Sale dropdown (DB-driven by `discountTitle`), Collections, Bundles, Design Your Own
- [x] Carousel slug mismatches fixed — `/collections/patriot` and `/collections/outdoorsman` hrefs corrected
- [x] `/collections/[slug]/[item-slug]` — item detail page with pricing tiers, high-detail upsell, add-to-cart
- [x] Cart context (`CartContext`) + `CartDrawer` + `AddToCartButton` + `AddCoverButton`
- [x] `ThreeMFStatic` — renders `.3mf` files as static images via Three.js (renders once, disposes WebGL)
- [x] `ItemDisplay` — shows 3MF viewer if `.3mf` exists, falls back to hero PNG
- [x] `/base-unit` — dedicated page for hitch cover base unit with 3MF viewer, pricing, what's included
- [x] 3MF viewer on item detail pages — truck-bg blurred photo context behind model
- [x] Heroes collection sorted by design slug (same designs group together across branches)
- [x] NavBar refactor — cart icon always visible on mobile, animated slide menu, touch-friendly sale dropdown
- [x] `factory/generate (1).py` — full 3MF + PNG generation pipeline: file mode, camo mode, logo-only mode
- [x] Images populated in `/public/collections/` and `/public/items/` for active collections
- [x] `dev_components` branch created for component refactoring
- [x] Site copy rewrite — witty, conservative, Made in America tone across homepage + collections page
- [x] Custom work CTA — `designs@3dpressusa.com`, any shape, live on homepage
- [x] Collection copy — eyebrow, subtitle, description seeded in DB for all 7 collections
- [x] Order confirmation email — customer + fulfillment emails via Brevo wired to Stripe webhook
- [x] `Footer` component — legal links, contact emails, copyright; added to root layout
- [x] `/legal/privacy` — Privacy Policy page
- [x] `/legal/returns` — Returns & Refunds page
- [x] `/legal/shipping` — Shipping Policy page

---

## Dead Routes — Needs Fixing

### Missing pages (no file at all)
- `/bundles` — linked from carousel slides. Needs a page built.
- `/collections/holiday` — linked from carousel. No collection seeded; holiday is a future collection.

### Legacy stub pages (file exists, red-border placeholder)
- `/hero` → redirect to `/collections/hero`
- `/outdoors` → redirect to `/collections/outdoorsman`
- `/patriotic` → redirect to `/collections/patriot`

---

## In Progress / Next Up

*(ordered — cart is last)*

1. **Component refactoring** (`dev_components` branch) — break heavy pages into reusable components without risking main
2. **`componentKey` support** on collection pages — render special components (e.g. `StickFigureGenerator`) when `Collection.componentKey` is set
3. **`/bundles`** — bundle builder page: mix collections, quantity-based tier pricing, cover add-on
4. **Legacy stub redirects** — `/hero`, `/outdoors`, `/patriotic` → permanent redirects to canonical collection URLs
5. **Seed remaining collections** — item names needed for: Patriot, Outdoorsman, Free Spirits, Adult Humor
6. **`/collections/holiday`** — holiday collection: seed + images (seasonal, date-relevance sorting comes later)
7. **Stripe webhook** — `/api/webhooks/stripe` receiver wired up; domain `3dpressusa.com`
8. **Cart / order flow** — add-to-cart → review → Stripe checkout (payment processor confirmed: Stripe)

---

## Image Naming Convention

### Collections (`/public/collections/`)
| File | Used for |
|---|---|
| `{slug}-carousel.png` | Card background on `/collections` grid + hero bg on detail page |
| `{slug}-product.png` | Product image overlaid on card + detail page hero |

### Items (`/public/items/`)
| File | Used for |
|---|---|
| `{slug}-hero.png` | Item card image on collection detail page |
| `{slug}-assembled.png` | Assembled/in-context view (item detail page) |
| `{slug}-in-use.png` | Lifestyle/in-use shot (item detail page) |

Override any of these per-record in the DB using the `*Override` fields on `Collection` / `Item`.

---

## Architecture Notes

- **Shared DB:** This site reads from the same Postgres instance as the inventory app. No writes from the storefront yet. Migrations are owned by the inventory app.
- **Server Components:** All collection/item pages are server components (no `"use client"`). Data fetched directly via Prisma.
- **Client Components:** Homepage carousel and design tool are `"use client"`. Keep them isolated.
- **Pricing schemes:**
  - `"standard"` — caps $10/$9/$8 (1/3+/5+)
  - `"heroes"` — same tier structure, $9 bundled with base unit
  - Base unit standalone → **$10**; **$9** when hero or patriotic caps are in the order
- **Tier is based on total cap quantity across the entire cart** — not per collection. 5 caps (mix of standard + hero) = everyone gets the 5+ rate on their respective scheme.
- `pricing-config.ts` has hardcoded tier constants used by the design tool and `pricing.ts`. DB tiers are the source of truth for display; `pricing.ts` is used for cart calculation.

---

## Open Questions

- `/bundles` scope — full bundle builder or just a landing page linking to collections for now?
- Holiday collection launch date — determines urgency of seeding + image work

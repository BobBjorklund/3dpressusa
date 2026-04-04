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

---

## Dead Routes — Needs Fixing

### Slug mismatches (homepage carousel links to wrong slugs)
| Carousel link | Seeded slug | Fix needed |
|---|---|---|
| `/collections/patriotic` | `patriot` | Update carousel slide `ctaHref` to `/collections/patriot` |
| `/collections/outdoors` | `outdoorsman` | Update carousel slide `ctaHref` to `/collections/outdoorsman` |

### Missing pages (no file at all)
- `/bundles` — linked from 3 carousel slides (main-cover, main-pricing, bundle-pricing). Needs a page built.
- `/collections/holiday` — linked from carousel. No collection seeded; holiday is a future collection.

### Legacy stub pages (file exists, red-border placeholder)
These predate the `/collections/[slug]` architecture. Each should become a redirect to its canonical URL once the collection slugs are confirmed.
- `/hero` → redirect to `/collections/hero`
- `/outdoors` → redirect to `/collections/outdoorsman`
- `/patriotic` → redirect to `/collections/patriot`

---

## In Progress / Next Up

*(ordered — cart is last)*

1. **Drop images** into `/public/collections/` and `/public/items/` using slug-based naming convention
2. **`/collections/[slug]/[item-slug]`** — item detail page: larger images, color selector (from inventory), add-to-cart button
5. **`componentKey` support** on collection pages — render special components (e.g. `StickFigureGenerator`) when `Collection.componentKey` is set
6. **`/bundles`** — bundle builder page: mix collections, quantity-based tier pricing, cover add-on
7. **Legacy stub redirects** — `/hero`, `/outdoors`, `/patriotic` → permanent redirects to canonical collection URLs
8. **Seed remaining collections** — item names needed for: Patriot, Outdoorsman, Free Spirits, Adult Humor
9. **`/collections/holiday`** — holiday collection: seed + images (seasonal, date-relevance sorting comes later)
10. **Cart / order flow** — add-to-cart → review → quote/inquiry (payment processor TBD; cart is last)

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
  - `"standard"` — caps $7/$6/$5, cover bundled $8
  - `"heroes"` — caps $6/$5/$4, cover bundled $7
  - Cover standalone (no caps in cart) → **$10** regardless of scheme
- **Tier is based on total cap quantity across the entire cart** — not per collection. 5 caps (mix of standard + hero) = everyone gets the 5+ rate on their respective scheme.
- `pricing-config.ts` has hardcoded tier constants used by the design tool and `pricing.ts`. DB tiers are the source of truth for display; `pricing.ts` is used for cart calculation.

---

## Open Questions

- Will the cart/order flow go to a form (email/inquiry) or a real payment processor?
- Is the item card the final leaf node for Sprint 1, or do item detail pages (`/collections/[slug]/[item-slug]`) belong here?

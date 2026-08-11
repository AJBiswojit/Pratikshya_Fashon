# PRATIKSHYA FASHON — Storefront & Product Discovery

Phase 4. The customer-facing catalogue: product data, the discovery engine
and the pages built on it.

This document covers what exists, how it is wired and the rules that keep it
consistent. For the visual language see `PRATIKSHYA-DESIGN-SYSTEM.md`; for
navigation and the app shell see `PRATIKSHYA-NAVIGATION.md`.

---

## 1. Principle

The storefront is a **premium editorial catalogue**, not a marketplace grid.
Every decision below follows from that: generous spacing, imagery before
controls, a quiet filter index rather than a dashboard sidebar, and editorial
copy in every state — including the empty one.

The landing page remains the visual source of truth. Nothing here introduces
a colour, typeface, radius or motion that is not already in the design
system.

---

## 2. Data architecture

Product data lives in `src/data/products/` and never in a component.

| File | Responsibility |
| --- | --- |
| `catalogue.js` | The authored records. Data only — 86 products. |
| `taxonomy.js` | The vocabulary: categories, facets, price bands, sorts, route scopes. |
| `index.js` | Normalises the catalogue into the shape the UI reads; lookups and derived vocabularies. |
| `query.js` | Pure filter / search / sort engine. No React. |
| `facets.js` | Builds counted filter options for a given scope. |

### Authored vs derived

An author writes only what is editorially meaningful — name, category, price,
fabric, occasion, imagery, ratings, flags. Everything else is **derived once
at module load** so it cannot drift:

- `id` (`pf-001`…), `slug`, `discount`, `currency`
- `image` / `hoverImage` resolved through the image manifest — never raw URLs
- `label` (first badge), `inStock`, `availabilityLabel`
- `tags` and `searchText` (the pre-built, punctuation-stripped search haystack)
- `score` (the Recommended ordering) and `addedOrder` (the Newest ordering)

`score` is the deliberate hook for a future recommendation service: it is the
only place ranking logic lives.

### Card compatibility

The normalised record is a **superset** of what the Phase 2 `ProductCard`
expects (`name`, `category`, `price`, `originalPrice`, `label`, `image`,
`hoverImage`, `inStock`). The card was not forked or reimplemented; it gained
one prop, `as`, so it can render the router's `Link` instead of a bare
anchor.

### Catalogue composition (86 products)

| Group | Count |
| --- | --- |
| Sarees | 22 — pato, silk, banarasi, cotton, printed, designer |
| Lehengas | 12 — bridal, wedding, designer, party |
| Bridal couture | 11 — bridal sarees, reception, sangeet, mehendi, trousseau |
| Bangles | 8 |
| Jewellery | 7 |
| Kurtis / suits / innerwear / dupattas | 10 |
| Menswear | 8 |
| Kidswear | 8 |

Priority is WOMEN › JEWELLERY › MEN/KIDS, as specified.

---

## 3. The discovery engine

**One implementation serves every listing route.**
`src/components/storefront/CatalogueBrowser.jsx` owns filtering, sorting,
counting, empty states and pagination. Pages supply a *scope* and nothing
else. There is no second grid, no second filter panel and no duplicated
query logic anywhere in the codebase.

```
route  →  scope (locked filters)  →  CatalogueBrowser
                                        ├── FilterPanel   (sidebar + drawer)
                                        ├── SortControl
                                        ├── ActiveFilters
                                        └── ProductGrid → ProductCard (Phase 2)
```

### Scopes

A scope is a named, pre-filtered view declared in `taxonomy.js`. Scope
filters are **locked**: they define the page, so they seed the query but are
never offered as removable chips or as filter options.

- `categoryRoutes` — the eight `/category/*` pages
- `collectionRoutes` — the four `/collection/*` pages
- `navigationScopes` — the 53 Phase 3 navigation paths that lead to product
  listings

That last table is what lets the existing mega menu land on real inventory
without inventing a parallel set of URLs. A manifest path with a scope
renders the storefront; every other manifest path keeps its Phase 3 interior
page. All previously working routes still resolve.

---

## 4. Routes

| Route | Renders |
| --- | --- |
| `/shop` | `Shop` — masthead, featured edit, category shortcuts, full catalogue |
| `/category/:slug` | `CatalogueListing variant="category"` — sarees, lehengas, bridal, wedding, bangles, jewellery, men, kids |
| `/collection/:slug` | `CatalogueListing variant="collection"` — new-arrivals, festive, wedding, featured |
| `/search?q=` | `SearchResults` |
| `/product/:slug` | `ProductPlaceholder` — holding page until Phase 5 |
| 53 navigation paths | `CatalogueListing variant="navigation"` |

An unknown category or collection slug renders the 404 page, not an empty
grid.

---

## 5. URL state

The query string is the single source of truth. Every view is shareable and
the back button walks filter history.

```
/shop?category=sarees
/shop?fabric=Cotton&occasion=Everyday
/shop?color=Gold,Maroon&price=5000-10000&sort=price-asc
/search?q=silk
```

- Multi-value facets are comma-joined (`?color=Red,Gold`), read as OR.
- Empty values are removed, not written as blanks.
- `?page=n` drives Load More; changing any filter resets it.
- Filter and sort writes use `replace`, so refining does not stack history
  entries; only navigation does.

---

## 6. Filters

Twelve facets, all declared in `taxonomy.js` and rendered generically —
adding one is a data change, not a UI change.

`category · subcategory · gender · price · size · colour · fabric · craft ·
occasion · collection · rating · availability`

**Counting.** Each option shows how many products it would yield, counted
against the set filtered by *every other* facet. Options that match nothing
are not offered, and a facet with fewer than two options is hidden entirely —
a category page never shows a filter that would empty it.

**Price bands.** Under ₹2,000 · ₹2,000–5,000 · ₹5,000–10,000 ·
₹10,000–25,000 · ₹25,000+, formatted `₹4,999` throughout.

**Desktop** — a sticky hairline index in the left column (`w-52`),
collapsible groups, the first four open. Long lists truncate to six with
"Show all".

**Mobile (<1024px)** — a Filter button opens a drawer sliding in from the
left with Apply / Clear All, an active-filter count, body-scroll lock,
Escape to close, focus moved in on open, focus trapped while open and
returned to the trigger on close.

Selections apply immediately on both. Active filters appear as removable
chips above the grid.

---

## 7. Sorting

Recommended (default) · Newest · Price Low→High · Price High→Low ·
Popularity · Rating.

A native `<select>` carrying the Atelier's typography — keyboard accessible,
screen-reader complete and rendered as the platform picker on a phone. Ties
break on `id`, so ordering is always deterministic.

---

## 8. Search

Client-side, case-insensitive, partial match. Every word of the term must
appear somewhere in the record, so "silk saree" narrows rather than widens.
Both sides are punctuation-stripped, so "Men's Kurta" matches.

Matched against: name, category, subcategory, gender, collection, fabric,
material, occasion, colours and badges.

The results page shows the query, an editorial result count, the matches, and
the same filters and sort as any other listing.

---

## 9. States

| State | Treatment |
| --- | --- |
| Results | Editorial count — "42 curated pieces", singular handled |
| Empty | `EmptyState` — "Not quite the right piece" + Clear Filters / Explore the Collection. Never "no data found". |
| Loading | `ProductGridSkeleton` — mirrors the card exactly so nothing shifts. No spinners. |
| Error | `ErrorState` — "The collection is temporarily unavailable" + Try Again. No technical detail. |

`EmptyState`, `ErrorState` and `ProductGridSkeleton` are new design-system
components, exported from the barrel alongside the Phase 2 set.

---

## 10. Grid & responsive

| Width | Columns | Card |
| --- | --- | --- |
| ≥1024px | 3 + filter index | ~291px desktop, ~205px laptop |
| 768–1023px | 2, drawer | ~320–353px |
| <768px | 2, drawer | ~152–179px |

Three columns rather than four is deliberate: with the filter index occupying
the left column, four would render a card narrower than the landing page's
product tile (192px vs 272px). Three keeps the plate at the scale the brand
already uses.

Verified by width arithmetic at 1440 / 1280 / 1024 / 834 / 768 / 430 / 390 /
375px — no horizontal overflow at any breakpoint. The category strip scrolls
horizontally below 640px by design rather than cramping into a grid.

---

## 11. Accessibility

- One `<h1>` per page, no heading level skipped
- Every image carries non-empty alt text
- Filter checkboxes have bound `<label for>`; groups expose `aria-expanded`
  and `aria-controls`
- Sort select is labelled; result count is an `aria-live="polite"` region
- Wishlist buttons expose `aria-pressed` and a descriptive `aria-label`
- Filter chips announce "Remove filter *Facet*: *Value*"
- Search form uses `role="search"` with a labelled input
- Breadcrumbs are a `nav` landmark marking `aria-current="page"`
- Drawer: `role="dialog"`, `aria-modal`, focus moved in, trapped, restored

---

## 12. Performance

- Images lazy-load below the fold via the manifest's `PratikshyaImage`
- `searchText` and `score` are computed once at module load, never per render
- Query results are memoised on the URL; unrelated re-renders do not refilter
- Stable `product.id` keys throughout
- Reveal animation delay is capped so long grids do not stagger indefinitely

---

## 13. Wishlist

`src/context/WishlistContext.jsx` — a session-scoped set of product ids. It
exists so the save control is genuinely interactive and the header count is
real rather than a placeholder. No persistence, no server, no cart. The bag
count remains a placeholder until the cart phase.

---

## 14. Out of scope (later phases)

Product detail page, cart, checkout, payment, orders, admin and employee
portals, inventory, analytics, the AI layer, and any backend, database,
authentication or real search service.

The catalogue is structured so a recommendation service can consume it
directly: `score` is the single ranking hook and `tags` the single semantic
surface.

# PRATIKSHYA FASHON — Navigation & Application Shell

Phase 3 documentation. This file describes **only what exists in the repository today**.

Phase 1 delivered the approved landing page. Phase 2 extracted it into the Atelier design system
(`docs/PRATIKSHYA-DESIGN-SYSTEM.md`). Phase 3 adds routing and a persistent application shell around
that page **without changing a single pixel of it**.

---

## 1. Scope

**In scope (built):** client-side routing, a persistent header with mega menu, a mobile drawer, a
search panel, a persistent footer, page transitions, scroll restoration, a generic interior page for
every category route, and a 404 page.

**Deliberately NOT built** (later phases): shop/PLP logic, product detail pages, cart, checkout,
payment, accounts, authentication, admin or employee portals, inventory, AI, backend, database.

Routes such as `/cart`, `/wishlist` and `/account` exist as **navigable placeholder destinations**
only, so no link in the shell is ever dead. They contain no commerce logic.

---

## 2. Information architecture

The entire IA lives in one file: **`src/config/navigationConfig.js`**. Nothing else in the codebase
hardcodes a route, a label, or a menu structure.

### Exports

| Export | Purpose |
| --- | --- |
| `brand` | Brand name and tagline used by the header and footer. |
| `primaryNavigation` | The 6 top-level groups, each with its mega-menu content. |
| `utilityNavigation` | Search, wishlist, account, cart actions. |
| `searchSuggestions` | 6 suggestion chips shown in the search panel. |
| `footerNavigation` | Footer link columns (Women / Occasions / Customer Care). |
| `legalNavigation` | Privacy, Terms, Contact. |
| `standalonePages` | The 8 non-category routes. |
| `routeManifest` | Flat list of every routable page with its metadata. |
| `getRouteMeta(pathname)` | Returns the manifest entry for a path, or `null`. |

### Primary groups

`women` · `bridal` · `men` · `kids` · `jewellery` · `collections`

Each group is shaped:

```js
{
  id, label, to, eyebrow, description,
  columns: [{ title, links: [{ label, to }] }],
  feature: { image, eyebrow, title, description, to, cta },
}
```

`columns` renders the link grid; `feature` renders the editorial image panel on the right of the
mega menu. `image` is always an **image-manifest id**, never a URL.

### Route manifest

Every entry is `{ path, label, eyebrow, description, image, group, breadcrumb[] }`. `CategoryPage`
reads it through `getRouteMeta`, so **adding a category is a data edit, not a code edit**.

Totals: **61 unique routes** + `/` + a catch-all. Verified: no duplicate paths, and every `to` in
every menu, footer column and legal list resolves to a real route.

---

## 3. Routing

`src/App.jsx`:

```
<Routes>
  <Route element={<CustomerLayout />}>
    <Route index element={<AtelierDesign />} />
    {routeManifest.map(r => <Route path={r.path} element={<CategoryPage />} />)}
    <Route path="*" element={<NotFound />} />
  </Route>
</Routes>
```

- `CustomerLayout` is a **shell route** — header and footer mount once and never re-render on
  navigation.
- Interior pages are generated from the manifest, so there is one `CategoryPage` implementation
  rather than 61 near-identical files.
- `react-router-dom` (7.18.2) was already a dependency. **No new package was installed in Phase 3.**

### `CustomerLayout`

Owns the page frame that used to live on the landing page:
`min-h-screen flex flex-col bg-canvas text-ink font-display` plus the gold `::selection`.

Order: `ScrollToTop` → `SiteHeader` → `AnimatePresence` → `PageTransition` → `Suspense` →
`Outlet` → `SiteFooter`.

`AnimatePresence mode="wait" initial={false}` — `initial={false}` prevents a transition animation on
first paint, so the landing page's own hero animation is the first thing the visitor sees, exactly as
in Phase 1.

Utility counts are **placeholder values** (`wishlist: 3`, `cart: min(products.length, 2)`) — there is
no cart state in this phase.

---

## 4. Shell components — `src/components/shell/`

| File | Responsibility |
| --- | --- |
| `SiteHeader.jsx` | Fixed translucent header, hover-intent mega menu, utility actions, drawer trigger. |
| `MegaMenu.jsx` | Desktop dropdown: 8 columns of links + 4-column editorial feature. |
| `SearchPanel.jsx` | Full-width search sheet with suggestion chips. |
| `MobileNav.jsx` | Right-hand drawer with accordion sections. |
| `SiteFooter.jsx` | The Phase 1 footer, verbatim, now data-driven. |
| `ScrollToTop.jsx` | Resets scroll on navigation. |
| `utilityIcons.js` | Shared Lucide icon map. |

### `SiteHeader`

Markup preserved from Phase 1:
`fixed top-0 left-0 right-0 z-50 bg-canvas/80 backdrop-blur-md border-b border-mist/50`,
`Container width="content" padded`, `h-16 md:h-20 flex items-center justify-between`.
Links keep the Phase 1 treatment: `text-[10px] uppercase tracking-[0.15em] text-brass hover:text-accent`.

Behaviour:
- **Hover intent** with a **120 ms close grace period**, so moving the pointer diagonally from a nav
  link into the panel does not dismiss it.
- Closes on `Escape` and on route change.
- Locks body scroll while the drawer or search panel is open.
- A desktop scrim dims the page behind an open mega menu.

`utilityIcons.js` exists to break a real circular import (`SiteHeader` ↔ `MobileNav`) — both need the
same icon map, so it was lifted into its own module rather than re-exported from either component.

### `MobileNav`

Right-side drawer, `max-w-sm` (384 px, full width at 375 px viewports). One accordion section open at
a time. Contains the utility grid and legal links so nothing is unreachable on small screens.

---

## 5. Responsive behaviour

The shell's desktop breakpoint is **`lg` (1024 px)**, not `md`.

This is a deliberate correction found during Phase 3 responsive QA. Phase 1's header had no utility
icons and fit at `md`. Adding the 4-icon utility rail (~156 px) pushed the desktop nav row to **790 px
against 672 px of available width at 768 px** — a 118 px overflow, and 52 px at 834 px.

Moving the breakpoint to `lg` resolves it. Measured headroom after the fix:

| Viewport | 1440 | 1280 | 1024 | 834 | 768 | 430 | 390 | 375 |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Header headroom (px) | +246 | +246 | +118 | +321 | +255 | +78 | +38 | +23 |

Below 1024 px the burger drawer is used. At and above 1024 px the inline nav and mega menu appear.

Layout geometry: inner width = `min(viewport, 1152) − 2 × gutter`, gutter 48 px at ≥768 px else 24 px
→ 1056 / 1056 / 928 / 738 / 672 / 382 / 342 / 327.

Mega-menu link columns measure 204.4 px at ≥1280 px and 176.0 px at 1024 px; the feature column is
338.7 px / 296.0 px.

---

## 6. Motion

Phase 3 added exactly one motion pattern to `src/design-system/motion.js`. **No Phase 2 token was
changed** (`duration.reveal` 0.6, `duration.hero` 1.2, `distance.short/medium/long` 20/25/30 all
verified unmodified).

| Token | Value |
| --- | --- |
| `duration.page` | `0.35` s |
| `distance.page` | `12` px |
| `pageTransition(travel, seconds)` | fade + 12 px rise; exit runs at **0.6×** duration |
| `usePageTransition()` | returns a zero-duration variant under reduced motion |

The faster exit is what makes `AnimatePresence mode="wait"` feel responsive rather than sluggish —
the outgoing page clears in 0.21 s before the incoming page begins.

`usePageTransition()` calls `useReducedMotion()` and swaps to `staticPage`, so users with
`prefers-reduced-motion` get instant navigation with no movement.

---

## 7. Interior pages

**`CategoryPage`** renders from manifest metadata only: `Breadcrumb` → `PageHeader` (eyebrow, `h1`,
description, hero image via `PratikshyaImage`) → a product grid built from existing mock data →
closing editorial band. It is a real, presentable page — not a "coming soon" stub — but it contains
no shop logic.

**`NotFound`** is an editorial 404: a short manifesto plus 6 group chips routing back into the main
sections.

### New design-system components

| Component | Purpose |
| --- | --- |
| `PageTransition` | Wraps route content in the shared enter/exit motion. |
| `Breadcrumb` | `<nav aria-label="Breadcrumb">` + `<ol>`, last crumb `aria-current="page"`. |
| `PageHeader` | Interior-page masthead; clears the fixed header via `pt-28 md:pt-32`. |
| `LoadingState` | Suspense fallback. |

The design-system barrel exports **54 symbols, none undefined**.

---

## 8. Accessibility

Verified by rendering routes to static HTML and asserting on the markup:

- Exactly one `<h1>` per page.
- `<header>`, `<main>`, `<footer>` landmarks present on every route.
- Primary nav exposes `aria-label="Primary"`; breadcrumbs expose `aria-label="Breadcrumb"` with
  `aria-current="page"` on the final crumb.
- Every icon-only button carries an `aria-label`; decorative SVGs are `aria-hidden`.
- Menus close on `Escape`; body scroll is locked behind overlays.
- Reduced motion is honoured for page transitions.

**Known contrast gap, carried over from Phase 2 and unchanged here:** `text-taupe` (#777) and
`text-ash` (#aaa) at `text-xs` / `text-[10px]` fall below WCAG AA. These are Phase 1 brand values;
changing them would alter the approved visual identity, so the decision is left to the owner.

---

## 9. Verification performed

| Gate | Result |
| --- | --- |
| `npm run build` | Passes — `dist/index.html` 480.08 kB, gzip 147.36 kB |
| Static render, all 63 routes | Clean — header + footer on every route, no `undefined` / `NaN` / `[object Object]` |
| Landing-page regression diff | **Zero diff** after accounting for the extracted nav + footer |
| Nav integrity | 61/61 routes unique; every link resolves; `getRouteMeta("/nope")` → `null` |
| Dev-server sweep | 17/17 routes HTTP 200 |
| Tailwind class compilation | Every shell class present in the compiled CSS |
| Unused imports | 16/16 files clean |
| Barrel exports | 54 exports, 0 undefined |
| Responsive | 8/8 breakpoints fit, no horizontal overflow |

No headless browser is available in this environment, so visual QA was done by static-HTML diffing,
compiled-CSS inspection, layout arithmetic, and HTTP probes rather than screenshots.

---

## 10. Rules for extending the shell

1. **Add routes by editing `navigationConfig.js`** — never by hardcoding a path in a component.
2. Images are referenced by **manifest id** through `PratikshyaImage`. Never a raw URL.
3. Use design-system components and tokens. Do not introduce new colours, fonts, or spacing scales.
4. The landing page is the visual source of truth. Any shell change must leave it pixel-identical.
5. Keep the desktop breakpoint at `lg` for shell chrome — `md` overflows once utility icons are present.
6. New motion goes in `motion.js` and must have a reduced-motion path.

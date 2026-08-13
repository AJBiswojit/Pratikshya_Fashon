# Phase 23.2 — Eliminate Legacy / Hardcoded Product Images

**Status:** Canonical media now renders for bangles / jewellery / innerwear ·
Legacy shared house plates eliminated from those product cards · Audits green.

Phase 23.1 proved *product visibility*. Phase 23.2 proves *image visibility* —
the exact photograph a ProductCard renders, not just the Product ID.

---

## 1. The problem (confirmed, not assumed)

The published products in three categories rendered **shared legacy house
plates** instead of the canonical library photography:

| Category | Before (rendered primary) |
|---|---|
| Bangles (8 products) | all → `house-bridal-bangles.jpg` (one shared plate) |
| Jewellery (7 products) | all → `house-bridal-bangles.jpg` (a *bangles* plate on necklaces/tikkas/rings) |
| Innerwear (3 products) | `house-heritage-textile.jpg` / pexels (shared fabric textures) |

Root cause: the canonical library photographs for these categories
(`jewellery-bangle-001…009`, `jewellery-earring-001…014`,
`jewellery-anklet-001…005`, `women-innerwear-001…019`) were ingested but
**unassigned** (register `productId = null`). The product cards therefore
fell back to the authored `image` fields, which resolve to shared house /
category artwork.

A second defect compounded it: `authoredOwnedPlates` added the authored house
plate to a product's gallery **even when** the product owned canonical media,
so the house plate could leak into the gallery and become the hover image.

---

## 2. The fix

### 2a. Canonical media → published product assignment (data)

`assignedProductMediaMap` deterministically maps unassigned library groups to
the published products that lack their own photography (same category, same
subcategory, ordered — the same filename convention the Kids reconciliation
uses, never a visual guess):

| Category | Assigned |
|---|---|
| Bangles | `jewellery-bangle-001…008` → the 8 published bangles |
| Jewellery | `jewellery-earring-001…002` → the 2 published *Earrings* |
| Innerwear | `women-innerwear-001…003` → the 3 published innerwear |

`syncCanonicalMediaAssignment` applies the ownership idempotently through the
media repository (first view COVER). Groups left over remain NEW product
drafts (Phase 23).

### 2b. Authored plates are a fallback, never a gallery peer (code)

`getProductMediaSet` now adopts authored plates **only when the product owns
no canonical media**. Once a product owns a library photograph, the shared
house plate can no longer enter its gallery or hover.

### 2c. Stable Product IDs (code)

Group-derived Product IDs are now assigned over the full static
manifest-derived group set, so an ID never renumbers when another group is
assigned to a published product — `jewellery-bangle-009` stays `BAN-009`,
`women-innerwear-004` stays `INN-004`, `jewellery-earring-003` stays `JEW-008`.

---

## 3. After (rendered primary, verified at runtime)

| Product | Rendered primary | Source |
|---|---|---|
| pf-046 … pf-053 (8 bangles) | `jewellery-bangle-001…008.webp` | CANONICAL |
| pf-056, pf-057 (2 earrings) | `jewellery-earring-001…002.webp` | CANONICAL |
| pf-065 … pf-067 (3 innerwear) | `women-innerwear-001…003.webp` | CANONICAL |

**Bangles 8/8 canonical · innerwear 3/3 canonical · jewellery 2/2 earrings
canonical.**

The five remaining published jewellery products (necklace, choker, maang
tikka, ring, jewellery set) have **no** canonical photograph of their product
type in the library — the library contains earrings and anklets, not
necklaces/tikkas/rings. They are reported honestly as *authored fallback* and
are **not** given an earring photograph (which would be a wrong product image,
explicitly forbidden). Their canonical photography does not exist yet.

---

## 4. Per-product render-source audit

`npm run audit:rendered-product-media` prints, for every published product:

`ID · Name · Category · Primary file · Source (CANONICAL / AUTHORED / NONE) ·
Hover file · Gallery count · Ownership (VALID / CROSS-PRODUCT)`

Result: **59 CANONICAL, 40 AUTHORED, 0 NONE, 0 cross-product, 0 duplicate
primary, 0 random, 0 hardcoded.**

`npm run audit:storefront-images` scans every customer-facing product
component and the product data for hardcoded `/images/` `/media/` `/library/`
paths, `Math.random`/`shuffle`, and direct `product.image` reads.

Result: **hardcoded = 0 · random = 0 · direct legacy reads = 0.**

---

## 5. Why the old audits were insufficient

- `audit:storefront-coverage` proved *which Product IDs* render — not *which
  image*.
- `audit:rendered-product-media` proves the *actual image source* per product
  and fails on cross-product / duplicate / random / hardcoded imagery.
- `audit:storefront-images` proves the *component* never hardcodes a path or
  randomizes image selection.

---

## 6. Answers to the phase's questions

1. Legitimate library products: 87 non-house/non-kids media groups.
2. Existing products: 168 records (99 PUBLISHED + 69 DRAFT).
3. New product drafts: 48 (reduced from 61 — 13 groups now belong to published products).
4. Published: 99.
5. Visible per category: published = rendered (Missing 0, Duplicate 0, Wrong category 0).
6. Missing from category pages: 0.
7. Why products were missing: none were — the 61 were DRAFT (correct); the *image* mismatch was the issue.
8. Hardcoded product lists: none.
9. Pagination limits hiding products: none (Load More exposes everything).
10. Taxonomy mismatch: none.
11. Duplicate products: 0.
12. Repeated images: 0 canonical repeats (shared authored house plates reported, not failed — they are the pre-library fallback for products with no canonical photo).
13. Cross-product images: 0.
14. Hover same-product: yes.
15. No-alternate unchanged on hover: yes.
16. Published PDP routes: all resolve.

Category table (published / rendered):

| Category | Published | Rendered | Missing | Duplicate |
|---|---|---|---|---|
| Sarees | 22 | 22 | 0 | 0 |
| Lehengas | 12 | 12 | 0 | 0 |
| Bridal couture | 11 | 11 | 0 | 0 |
| Kurtis + Suits | 4 | 4 | 0 | 0 |
| Innerwear | 3 | 3 | 0 | 0 |
| Dupattas | 3 | 3 | 0 | 0 |
| Bangles | 8 | 8 | 0 | 0 |
| Jewellery | 7 | 7 | 0 | 0 |
| Men's Wear | 8 | 8 | 0 | 0 |
| Kids Wear | 21 | 21 | 0 | 0 |

---

## 7. Files changed

- `src/services/catalogueReconciliation.js` — deterministic canonical→published
  assignment (`assignedProductMediaMap`), idempotent ownership sync
  (`syncCanonicalMediaAssignment`), stable manifest-derived groups/IDs.
- `src/services/media/productMediaSet.js` — authored plates are fallback-only
  (never a gallery/hover peer when canonical media exists).
- `src/services/catalogRepository.js` — runs the assignment sync in the read path.
- `scripts/audit-rendered-product-media.mjs` — **new.**
- `scripts/audit-storefront-images.mjs` — **new.**
- `scripts/audit-catalog-completeness.mjs` — reports the assigned/catalogued/new split.
- `tests/storefrontImageReconciliation.test.js` — **new.** 7 tests.
- `tests/catalogueReconciliation.test.js` — updated for assignment-aware counts.
- `package.json` — two new audit scripts.

---

## 8. Validation

```
npm test                          PASS  (267 tests)
npm run build                     PASS
git diff --check                  PASS
audit:catalog-completeness        PASS
audit:storefront-coverage         PASS
audit:storefront-images           PASS   (hardcoded 0 · random 0 · legacy reads 0)
audit:rendered-product-media      PASS   (cross-product 0 · duplicate 0 · random 0 · hardcoded 0)
audit:product-repetition          PASS
audit:product-media               PASS
audit:media-products              PASS
audit:homepage                    PASS
```

Kids `KID-001…KID-021` remain intact (21 distinct plates, no cross-product
media). No authentication / checkout / payments / orders / analytics /
taxonomy / media architecture was modified.

---

## 9. Honest limitations

- The 5 published jewellery products whose product type (necklace / choker /
  maang tikka / ring / set) has **no** library photograph remain on their
  authored plate. Putting an earring photograph on a necklace would be the
  exact "wrong product image" this phase forbids; the correct resolution is
  new photography, not a guess.
- The 48 library-backed products (earrings, anklets, extra bangles, innerwear)
  remain DRAFT until a human names/prices them through the existing review
  desks — publishing is never automatic.

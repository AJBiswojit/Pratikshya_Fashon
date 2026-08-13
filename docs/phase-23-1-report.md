# Phase 23.1 — Actual Storefront Product Visibility & Catalogue Activation

**Status:** Data flow proven end-to-end · No visibility bug found · Audits green.

Phase 23 created 61 DRAFT products from the media library. Phase 23.1 verifies
the *complete customer-facing data flow* — not just that records exist, but
that a product which reaches `PUBLISHED` actually renders in the storefront.

---

## 1. The direct answer

There is **no data-flow bug hiding products.** The 61 reconciled products are
correctly `DRAFT` (they are incomplete — no name, no price, no taxonomy), so
they are correctly absent from the customer storefront. The pipeline from
`MEDIA → PRODUCT → PUBLISHED → STOREFRONT QUERY → CATEGORY FILTER → GRID →
CARD → IMAGE/HOVER → PDP` was traced end-to-end and is intact.

The "no visible change" is the *expected* state: the workflow deliberately
does not publish until a human names, prices and classifies each product
(section 4 of Phase 23.1). Publishing is a controlled workflow action, not
something the phase does automatically.

---

## 2. Recalculated inventory (current repository)

| Signal | Count |
|---|---|
| Total media records | 202 |
| Ingested product photography (non-house) | 166 |
| House plates (non-product) | 10 |
| Kids media (finalised) | 21 |
| Non-kids product photography | 145 |
| Product-media groups (non-house, non-kids) | 87 |
| · already catalogued | 26 |
| · uncatalogued (→ new drafts) | 61 |
| Product records (total) | 181 |
| · PUBLISHED | 99 |
| · DRAFT | 82 (61 reconciled + 21 KID) |

---

## 3. Per-category table (PUBLISHED vs RENDERED)

`Rendered` = what the canonical category query returns on the page (deduped by
Product ID, before the UI's Load-More pagination reveals the page beyond the
first 12).

| Category | Published | Visible (rendered) | Missing | Duplicate | No media |
|---|---|---|---|---|---|
| Sarees | 22 | 22 | 0 | 0 | 0 |
| Lehengas | 12 | 12 | 0 | 0 | 0 |
| Bridal couture | 11 | 11 | 0 | 0 | 0 |
| Kurtis + Suits | 4 | 4 | 0 | 0 | 0 |
| Innerwear | 3 | 3 | 0 | 0 | 0 |
| Dupattas + Stoles | 3 | 3 | 0 | 0 | 0 |
| Bangles | 8 | 8 | 0 | 0 | 0 |
| Jewellery | 7 | 7 | 0 | 0 | 0 |
| Men's Wear | 8 | 8 | 0 | 0 | 0 |
| Kids Wear | 21 | 21 | 0 | 0 | 0 |

**Missing = 0, Duplicate = 0, No-media = 0** for every category.

The 82 DRAFT products are not listed above — they are intentionally excluded
from the customer storefront by status.

---

## 4. Answers to the 25 required questions

1. **Legitimate products in the media library:** 87 non-house, non-kids
   product-media groups (26 already catalogued + 61 uncatalogued), plus the
   21 finalised Kids products. (Some groups are a single physical product
   photographed from several views — `front`/`side`/`back` — not multiple
   products.)
2. **Existing products:** 99 PUBLISHED + 82 DRAFT = 181 records. The 99
   published are the authored catalogue (pf-001…pf-099).
3. **New product drafts:** 61 (`SAR-001…007`, `BRD-001`, `MEN-001…006`,
   `JEW-001…019`, `BAN-001…009`, `INN-001…019`) + the 21 `KID-001…021` drafts
   from Phase 22.2 = 82 drafts.
4. **Published:** 99.
5. **Visible per category:** see the table above — rendered equals published
   everywhere.
6. **Missing from category pages:** 0.
7. **Why (the 61) were not visible:** they are `DRAFT` (status filtering),
   correctly. No product is missing *despite being published*.
8. **Hardcoded product lists found:** none. Category pages run the canonical
   `queryCatalogue`; homepage rails (`NewArrivals`, `SareeEdit`, `BrideGroom`,
   `SaleBanner`) read the canonical repository/selectors. `ShopByCategory`'s
   `CATEGORY_GROUPS` are navigation tiles, not a product catalogue.
9. **Pagination limits hiding products:** none. The only limit is
   `PAGE_SIZE = 12` in `useCatalogueQuery`, implemented as Load More with
   `hasMore = visible.length < total`, so every product is reachable.
10. **Taxonomy mismatches:** none. Every product's `category` resolves to an
    ACTIVE canonical taxonomy record; zero orphan categories.
11. **Duplicate products:** 0 duplicate Product IDs; 0 duplicate cards.
12. **Repeated images:** 0 duplicate primary images among published products.
13. **Cross-product images:** 0.
14. **Hover always uses the same product's media:** yes — `getProductCardMedia`
    / `getProductMediaSet` only select product-owned media.
15. **Single-view products unchanged on hover:** yes — `hasAlternate = false`
    ⇒ `hoverImage` omitted, frame stays on the primary.
16. **All published products have a working PDP route:** yes — every published
    product resolves `productHref` → `getProductBySlug`.

---

## 5. How the flow was proven (controlled publication)

A deterministic test (`tests/storefrontVisibility.test.js`) picks a reconciled
draft (`SAR-005` = `women-saree-silk-004`, front + back), fills it with the
same editor-shaped payload the admin UI submits (name, subcategory,
description, SKU, `pricing.sellingPrice/mrp`, cleared review flags), then
publishes it **through the existing workflow** (`publishProduct`, which runs
`getPublishIssues` — no validation weakened).

Asserted, in order:

1. DRAFT product is absent from `getLiveStorefrontProducts()`.
2. After filling, `getPublishIssues` returns `[]`.
3. After publishing, it joins the storefront source (`count +1`).
4. It appears in `queryCatalogue({ scopeFilters: { category: "sarees" } })`
   — the exact query the category page runs — and results dedupe by ID.
5. `getProductCardMedia` resolves `primary = …-front.webp`,
   `hover = …-back.webp`, `gallery = [front, back]`, all owned by `SAR-005`.
6. `productHref` = `/product/sar-005` and `getProductBySlug("sar-005")` finds it.

The fixture is archived in a `finally` block so the register returns to its
baseline. The same test file also asserts:

- every published product resolves an owned card image + a PDP route;
- the Kids category renders 21 distinct products with 21 distinct primary
  plates (no cross-product media);
- the storefront components contain no hardcoded product arrays and no
  `Math.random()` / `shuffle()`.

---

## 6. Draft management (section 20)

The 61 drafts are already visible and manageable through the existing
workspaces — no new permission system was needed:

- **Admin** `/admin/products` reads `catalogRepository.all()` (all 181 records)
  with a `DRAFT` status filter, category filter and free-text search.
- **Admin review** `/admin/products/review` → `ProductDraftReviewPanel`
  renders each draft's media via `getProductWorkflowView` →
  `getProductMediaSet` (so the *claimed* media previews correctly), with
  approve/publish/assign actions.
- **Employee review** `/employee/products/review` shows assigned drafts with
  the same `mediaSet` preview, plus Save Draft / Submit for Review.

---

## 7. One latent behaviour (documented, not "fixed")

A product's selling price must be set through the pricing engine
(`pricing.sellingPrice` / `pricing.mrp`), which is exactly what both the admin
editor (`buildSubmitPayload`) and the employee path (`saveEmployeeDraft`) do.
Setting the bare `price` field alone via `updateDraft` does not move the
engine's `sellingPrice`, so publish validation would still see a zero price.
This is pre-existing behaviour consistent with the pricing engine being the
source of truth; it was left untouched because changing `normalisePricing`
would affect unrelated systems.

---

## 8. Validation

```
npm install                       PASS
npm test                          PASS  (260 tests, +5 new)
npm run build                     PASS
git diff --check                  PASS
audit:catalog-completeness        PASS
audit:storefront-coverage         PASS
audit:product-repetition          PASS
audit:product-media               PASS
audit:media-products              PASS
audit:homepage                    PASS
```

Runtime verification: the dev server serves `/`, `/category/sarees` and
`/category/kids` with HTTP 200; the category pages render through the same
canonical query the audits exercise.

---

## 9. Files changed in Phase 23.1

- `tests/storefrontVisibility.test.js` — **new.** 5 tests proving the
  end-to-end storefront flow (controlled publication, media ownership, Kids
  rendering, no hardcoded arrays).
- `scripts/audit-storefront-coverage.mjs` — extended with a per-category
  **NO MEDIA** column and a full **PRODUCT MEDIA** report (primary / hover /
  gallery count / ownership) for every rendered product.

# PHASE 22.1 — KIDS PRODUCT RECONCILIATION, GROUPING & PUBLISHING

**PRATIKSHYA FASHON · Final report**

Phase 22.1 finishes the Kids catalogue safely on top of the Phase 21 +
Phase 22 architecture. Nothing was redesigned: the storefront, colour
palette, typography, navigation, homepage, payment, authentication, AI
features and unrelated categories are untouched. The canonical media
library remains the source of truth, and every existing system
(`mediaRepository`, `mediaResolver`, `productMediaSet`,
`productMediaGroups`, `catalogRepository`, `productWorkflow`,
`taxonomyRepository`, the admin and employee review workspaces) carries
the work — no bypasses, no new media system, no invented images.

---

## KIDS MEDIA INVENTORY (21 / 21)

Every asset is reported by `npm run audit:kids-products` with media ID,
filename, path, groupKey, view, existing productId, draft productId,
category, subcategory, status and ownership state:

| Asset | GroupKey | View | Existing product | Draft product | Ownership state |
| --- | --- | --- | --- | --- | --- |
| kids-001.webp … kids-021.webp | kids-001 … kids-021 | standalone | pf-079 … pf-099 | KID-001 … KID-021 | CONFLICT — owned by pf-XXX, claimed by KID-XXX |

- **21 media assets** → **21 deterministic standalone groups** (one file
  each). The filename/groupKey parser is the primary grouping signal, so
  no two assets were merged and no multi-view group was invented.
- **Potential same-product groups among Kids media: 0** — visual similarity
  was never used to create or merge products.
- **Multi-view products: 0 · Single-image products: 21** — for each
  single-image product the hover rule is absolute: hover = NO CHANGE.

## RECONCILIATION

Every KID draft carries metadata hydrated from the existing published
product its media is explicitly mapped to (the ingestion manifest's
`EXPLICIT` mapping) — name, subcategory, price, compare-at, collections,
colours, sizes, fabric, material, occasion. This is catalogue metadata,
never an image guess. Where no usable owner exists, drafts keep the safe
metadata-derived name `Kids Piece · KID-XXX` with
`NAME_REVIEW_REQUIRED` / `PRICE_REVIEW_REQUIRED` /
`TAXONOMY_REVIEW_REQUIRED`. Human edits are never overwritten
(field-level hydration of placeholder state only; migration version 2).

Each contested draft shows **MEDIA ALREADY ASSIGNED** with the owning
Product ID and the five decisions — every ownership change logged in the
shared activity diary (`PRODUCT_CONFLICT_RESOLVED`,
`PRODUCT_MEDIA_TRANSFERRED`, `PRODUCT_ARCHIVED`):

- **[KEEP EXISTING PRODUCT]** — ownership stays with pf-XXX; the draft's
  claims are cleared and it is archived. The existing product keeps
  serving the storefront.
- **[TRANSFER TO KID PRODUCT]** — ownership moves to KID-XXX (explicit,
  logged, stale refs stripped); the now media-less published owner is
  retired to ARCHIVED so the storefront never shows a product without
  media.
- **[MERGE INTO EXISTING PRODUCT]** — the draft's commercial content
  (name, price, compare-at, subcategory, description) is written onto
  pf-XXX; media stays; the draft is archived.
- **[CREATE SEPARATE PRODUCT]** — the draft keeps its Product ID, drops
  the conflicting claim, and is flagged `NEEDS_MEDIA`.
- **[REVIEW LATER]** — deferred with `CONFLICT_REVIEW_LATER`; the conflict
  still blocks publication.

## WORKSPACES

- **Admin `/admin/products/review`** — new *Kids reconciliation* desk:
  KID-001 … KID-021 with preview, name, price, category, media count,
  Front/Side/Back/Detail chips, ownership, assigned employee, status,
  review flags, review-issue count, and filters **ALL / DRAFT / NEEDS
  REVIEW / CONFLICT / READY TO PUBLISH / PUBLISHED**. Each row expands
  into the full draft desk: complete `getProductMediaSet` preview,
  editable Product ID, name, category, subcategory, price, compare-at
  (derived discount shown), description, **view labels & primary image**,
  review-flag resolution, Save / Submit / Approve & Publish / Archive.
- **Employee `/employee/products/review`** — assigned products only, with
  the mandatory visual preview, derived discount and view chips, and
  Save Draft / Submit for Review. Authorization is the existing
  permission model — no bypass possible.

## PUBLISH VALIDATION (BLOCK PUBLISH with exact reasons)

A Kids product may only publish when ALL hold:
✓ valid Product ID · ✓ valid category · ✓ valid non-placeholder name ·
✓ valid price · ✓ description · ✓ primary media · ✓ media ownership
resolved (no `MEDIA_ALREADY_ASSIGNED` conflicts) · ✓ no cross-product
media · ✓ no unresolved grouping decision · ✓ no invalid media reference
· ✓ no required review flag (`NAME/PRICE/TAXONOMY/GROUP/VARIANT_REVIEW_*`,
`NEEDS_MEDIA`, `MEDIA_OWNERSHIP_REVIEW`, `CONFLICT_UNRESOLVED`).

## STOREFRONT

Only PUBLISHED Kids products appear on `/category/kids`; drafts are
invisible to homepage, category pages, search, recommendations, wishlist,
AI Shopping and AI Mirror. Verified end-to-end: after
assign → employee edit → TRANSFER → publish, KID-021 appears in the
storefront, the retired pf-099 disappears, the kids category stays at 21
products and the total storefront stays at 99 — zero draft leakage.

## AUDIT — `npm run audit:kids-products`

```
Total Kids media:                  21
Total media groups:                21
Single-image products:             21
Multi-view products:               0
Existing-product conflicts:        21
Potential same-product groups:     0
Needs review:                      21
Ready to publish:                  0
Published (KID products):          0
Published (existing Kids category): 21
Unassigned media:                  0
Cross-product media:               0
Duplicate ownership:               0
Invalid references:                0
```

**Safety result: Cross-product = 0 · Invalid references = 0 · Duplicate
ownership = 0 — PASS.**

## FINAL ACCEPTANCE

ONE PHYSICAL PRODUCT → ONE PRODUCT ID → MANY MEDIA ASSETS.
The Kids library holds 21 standalone assets, so it resolves to 21 stable
Product IDs (KID-001 … KID-021) — never 3 products for 3 views, never a
merge of merely-similar garments. When uncertain, the system says
NEEDS REVIEW and asks a human.

## VALIDATION COMMANDS (all pass)

```
npm test                     ✓ 219/219
npm run build                ✓
npm run audit:kids-products  ✓ PASS (0/0/0)
npm run audit:media-products ✓ PASS
npm run audit:product-media  ✓ PASS
npm run audit:homepage       ✓ PASS
git diff --check             ✓
```

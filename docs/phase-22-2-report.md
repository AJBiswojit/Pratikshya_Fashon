# PHASE 22.2 — KIDS PRODUCT FINALIZATION & PUBLISHING

**Status:** implemented · **Date:** 2026-08-13 · **Branch:** `arena/019ffb63-pratikshya-fashon`

Extends Phase 22 / 22.1. No second product database, no duplicate category
system, no duplicate permission model, no duplicate status system — every
addition sits on top of `catalogRepository`, `taxonomyRepository`,
`productMediaSet`, `authorization` and `activityService`.

---

## 1. The confirmed decision

`kids-001.webp → KID-001` … `kids-021.webp → KID-021` are **21 separate
physical products**. This is now data, not a convention:
`src/services/kidsProductIdentity.js` is a zero-import leaf module holding
`CONFIRMED_KIDS_IDENTITIES`, and every consumer reads it.

An explicit `SEPARATE_PRODUCT` group decision is recorded per asset in the
existing `pratikshya_media_groups` register (`kids-confirmed-kid-001` …),
logged as `KIDS_MEDIA_GROUP_CONFIRMED`. `ensureKidsIdentitiesConfirmed()`
bootstraps this once per session, so the decision survives a cold start.

**The merge is refused, not merely discouraged:**

| Attempt | Result |
| --- | --- |
| `decideProductGroup(SAME_PRODUCT)` on two Kids plates | refused — *"CONFIRMED separate products"* |
| `createProductDraftFromMedia` from two Kids plates | refused |
| `transferMediaOwnership(kids-002 → KID-001)` | refused, ownership untouched |
| `getPotentialProductGroups` | Kids groups with a settled decision never re-enter the similarity queue |

Product IDs are permanent: they are the record identity, not the name and not
the filename.

## 2. Ownership — one product, one plate

`kidsMediaOwnershipIssues(product)` reports `CROSS_PRODUCT_MEDIA`,
`CROSS_PRODUCT_OWNERSHIP`, `CROSS_PRODUCT_GALLERY` and `WRONG_PRIMARY`, each
naming the product the plate really belongs to. The audit confirms
**cross-product media 0, duplicate ownership 0, invalid references 0**.

The 21 pre-existing conflicts are resolved **explicitly, per product**, through
`reconcileKidsConflict` with `[KEEP EXISTING] [TRANSFER TO KID-xxx]
[CREATE SEPARATE PRODUCT] [REVIEW LATER]`. Nothing is transferred, deleted or
replaced silently; every decision is written to the activity diary.

## 3. Hover

A standalone image never swaps. `getProductCardMedia` returns
`hoverImage: undefined` when `hasAlternate` is false, and `ProductCard` is the
single consumer. No `Math.random()`, no `shuffle()`, no fallback-, category- or
related-product image resolution anywhere in the path. Audit: **hover
replacements 0**.

## 4. Product information

Editable through the existing architecture: ID, Name, Category, Subcategory,
Gender, Description, Price, Compare-at, Discount, Inventory, Status, Primary
Media, Gallery, Assigned Employee.

- **Names are never invented from images.** The safe initial name is
  `Kids Product · KID-001`. A genuinely-owned catalogue name is inherited only
  when it passes `kidsNameLooksForeign`; a Women's / Men's / Bridal name is
  refused and raises `NAME REVIEW REQUIRED`.
- **Category** is Kids Wear via `taxonomyRepository`. An unknown subcategory
  raises `SUBCATEGORY REVIEW REQUIRED` — never forced to a wrong value to make
  a product publishable.
- **Price** is per product. No Women's/Men's prices copied, no single arbitrary
  price across the 21.

## 5. Routing

Fixed in this phase: the 21 drafts were inheriting their published sibling's
slug, so `KID-001` and `pf-079` resolved to the same URL. Kids drafts are now
keyed on the permanent Product ID (`/product/kid-001`) whenever the
name-derived slug is claimed. **Duplicate slugs: 21 → 0.** Migration bumped to
`PRODUCT_DRAFT_SYNC_VERSION = 4`; human edits are preserved.

## 6. Lifecycle & publish validation

`DRAFT → EMPLOYEE REVIEW → SUBMITTED → ADMIN REVIEW → APPROVED → PUBLISHED`,
built from the existing DRAFT / PENDING_REVIEW / PUBLISHED statuses plus the
existing `review.state`.

`getKidsPublishBlockers` **blocks with the exact reason**: missing or
placeholder name, foreign name, wrong category, missing subcategory, price ≤ 0,
missing description, no primary media, cross-product media, unconfirmed
identity, invalid inventory, unresolved conflicts, blocking review flags.
`publishKidsProduct` additionally refuses anything not explicitly approved.

**Nothing was auto-published.** All 21 remain DRAFT, awaiting an admin decision.

Activity: `KIDS_PRODUCT_CREATED / UPDATED / ASSIGNED / SUBMITTED / APPROVED /
PUBLISHED`, `KIDS_MEDIA_TRANSFERRED`, `KIDS_MEDIA_GROUP_CONFIRMED` — aliases of
the existing `ACTIVITY_ACTIONS`, so no parallel label system. Every save writes
`updatedAt` / `updatedBy`.

## 7. Storefront visibility

Only `status === PUBLISHED` reaches customers. Every surface — listing,
category, search, homepage, collections, new arrivals, sale, wishlist,
recommendations, AI Shopping, AI Mirror — funnels through
`getLiveStorefrontProducts()`, and the direct lookups (`getProductById`,
`getProductBySlug`, `getProductByIdentifier`) read the same live list. A test
asserts each of the 21 drafts is unreachable through all of them.

## 8. Workspaces

**Admin — `/admin/products/review`** · `AdminKidsFinalizationPanel.jsx`
All 21 in one place: search, plus STATUS / QUALITY / ASSIGNMENT filters
(including *ready to publish* and *needs review*). Each card shows the image
and filename, Product ID, name, price, category, status, employee, media
ownership and review flags, with inline edit, employee assignment,
Approve / Publish / Return, an explicit blocker list, and arm-then-confirm
conflict buttons. A collapsible **21 × 9 checklist** covers correct media,
name, category, subcategory, price, employee reviewed, admin reviewed, ready to
publish, published — with a reason attached to every unchecked box.

**Employee — `/employee/products/review`** · only assigned products, via the
existing authorization model. Mandatory large image plus filename, Product ID,
name / category / subcategory / price / **inventory** editing, a name-review
warning, and Save Draft / Submit for Review. Protected fields (ID, status,
assignment, media) are ignored on save.

## 9. Validation

| Check | Result |
| --- | --- |
| `npm install` | clean |
| `npm test` | **244 / 244 pass** (was 219; +25 new) |
| `npm run build` | ✓ built |
| `npm run qa:render` | **35 / 35 render checks pass** |
| `git diff --check` | clean |
| `npm run audit:kids-products` | **PASS** |
| `npm run audit:media-products` | PASS |
| `npm run audit:product-media` | PASS |
| `npm run audit:homepage` | exit 0 |

### Render QA

No headless browser is available in this environment, and a route returning
200 only proves the SPA shell loaded. `npm run qa:render`
(`scripts/qa-render-kids.mjs`) therefore server-renders the three surfaces and
asserts on the real output, so a broken import, a bad prop or a crashing
selector fails the build rather than the user:

- **Admin** — 21 Product IDs and 21 filenames present, 21 distinct images with
  none reused, search, all filters, the checklist, all four conflict actions,
  the blocker list, the "nothing is transferred silently" warning, hover and
  ownership lines, no leaked `undefined` / `[object Object]`.
- **Employee** — renders authenticated with assigned products, mandatory image,
  filename, price and inventory fields, Save Draft and Submit for Review.
- **Storefront** — 21 cards, one image each, none reused, zero hover swaps, no
  `KID-xxx` draft leaked.

A `scripts/node-loader/jsx-resolve.mjs` hook (QA only, never loaded by Vite or
production) adds JSX support to the existing test loader via Vite's own
`transformWithEsbuild`.

### Audit figures

```
Total Kids products:            21   (KID-001 → KID-021)
Distinct Product IDs:           21
Distinct media assets:          21
Identity confirmed (SEPARATE):  21
Draft / Review / Ready / Published:  21 / 0 / 0 / 0
Cross-product media:             0
Duplicate ownership:             0
Invalid media references:        0
Hover replacements:              0
Potential same-product groups:   0
```

### A bug the render pass could not catch

Driving `KID-001` through the whole path end to end — resolve conflict, edit,
approve, publish — surfaced a defect that all 242 unit tests and all 35 render
checks had missed. The `SEPARATE_PRODUCT` bootstrap only ran when
`getKidsFinalizationRows()` was read, so an admin publishing through any other
entry point was blocked by:

> Confirmed product identity missing — record the SEPARATE_PRODUCT decision for
> KID-001 first.

The system was demanding the admin perform bookkeeping the system itself owns,
with no UI to do it. `ensureKidsIdentitiesConfirmed` now self-heals: it is
called wherever identity is asserted, and its once-per-session latch is trusted
only while the register still agrees, so a reset or a failed write re-records
the decision instead of blocking a publish. Covered by two new tests.

Verified end to end afterwards: blockers fall 8 → 2 → 0 as real work is done,
publish-before-approval is refused, the published product routes on
`kid-001` (not the colliding name slug), the emptied prior owner `pf-079` is
archived rather than left live without an image, the other 20 stay DRAFT, and
nine distinct actions are written to the activity diary.

### Expected open items

The 21 ownership conflicts, the 21 `CONFLICT_UNRESOLVED` flags and the 21
"no primary image" entries are the **correct pre-decision state**. Each plate is
still owned by its published `pf-0xx` sibling and claimed by its `KID-xxx`
draft. They clear only when an admin makes an explicit, logged decision per
product — which is exactly the guarantee this phase was asked to provide.

## 10. Scope

Untouched: Women's, Men's, Bridal, Jewellery, Bangles, Innerwear, Accessories,
homepage design, AI Mirror, AI Shopping, checkout, orders, payments,
attendance, analytics, settings. A test asserts the non-Kids catalogue is
unchanged.

## 11. Files

**New** — `src/services/kidsProductIdentity.js`,
`src/services/kidsProductFinalization.js`,
`src/components/admin/AdminKidsFinalizationPanel.jsx`,
`tests/kidsFinalization.test.js`, `scripts/qa-render-kids.mjs`,
`scripts/node-loader/{jsx-resolve,register-jsx}.mjs`, this report.

**Extended** — `src/services/productWorkflow.js`,
`src/services/productDraftMigration.js`, `src/services/productReviewFlags.js`,
`src/pages/admin/AdminProductReview.jsx`,
`src/pages/employee/EmployeeProductReview.jsx`,
`scripts/audit-kids-products.mjs`, `tests/kidsReconciliation.test.js`,
`package.json` (adds `qa:render`).

# Phase 23 — Product Catalogue Reconciliation & Storefront Coverage

**Status:** Reconciliation complete · Audits green · No storefront redesign.

Phase 23 extends the Phase 21 + Phase 22 architecture (one media register, one
product register, one taxonomy, one review pipeline) so that every legitimate
product photograph in the canonical media library maps to exactly one product
record. It does **not** create a second media system, a second product system,
or a second taxonomy system.

---

## 1. What was reconciled

The canonical media root `public/library` holds **166** ingested product
photographs plus **10** house plates. Grouping by the deterministic filename
convention (`women-saree-silk-004-front / -back` → one group) yields **87**
product-media groups across seven non-Kids categories.

| Category | Media groups | Catalogued | New candidates | Needs review |
|---|---|---|---|---|
| Sarees | 19 | 12 | **7** | 2 |
| Lehengas | 5 | 5 | 0 | 0 |
| Bridal couture | 6 | 5 | **1** | 1 |
| Men's wear | 10 | 4 | **6** | 0 |
| Jewellery | 19 | 0 | **19** | 5 |
| Bangles | 9 | 0 | **9** | 0 |
| Innerwear | 19 | 0 | **19** | 1 |
| **Total** | **87** | **26** | **61** | 9 |

The 21 Kids products (`KID-001` … `KID-021`) are finalised and were **not**
re-migrated, regrouped, renamed, merged or duplicated.

### Rules honoured

- **ONE physical product = ONE Product ID.** A multi-view group
  (`front` / `side` / `back`) becomes one record — never three.
- **Similar ≠ same.** Groups with different `groupKey`s are never merged;
  visual similarity is at most a review signal.
- **No guessing.** Uncertain identity is expressed with
  `GROUP_REVIEW_REQUIRED` / `TAXONOMY_REVIEW_REQUIRED`, never a silent
  assumption.
- **No hallucinated data.** Every new draft carries a safe name, a zero price
  and the `NAME_REVIEW_REQUIRED` / `PRICE_REVIEW_REQUIRED` flags — a human
  must name, price and classify before anything publishes.
- **No auto-publish.** Every new record starts in `DRAFT` and is invisible to
  customers until the existing `DRAFT → EMPLOYEE REVIEW → SUBMITTED →
  ADMIN REVIEW → APPROVED → PUBLISHED` pipeline is walked.

---

## 2. New Product IDs

61 permanent, category-prefixed Product IDs were assigned deterministically
(grouped by category, ordered by groupKey):

| Category | IDs | Count |
|---|---|---|
| Sarees | `SAR-001` … `SAR-007` | 7 |
| Bridal couture | `BRD-001` | 1 |
| Men's wear | `MEN-001` … `MEN-006` | 6 |
| Jewellery | `JEW-001` … `JEW-019` | 19 |
| Bangles | `BAN-001` … `BAN-009` | 9 |
| Innerwear | `INN-001` … `INN-019` | 19 |

Existing published IDs (`pf-001` … `pf-099`) are untouched and remain stable.

---

## 3. Media ownership

New drafts claim their media through the product record's own
`mediaIds` / `primaryMediaId` / `galleryMediaIds` — the same claims model the
Kids migration uses. Register-level ownership transfer remains a
`productWorkflow` action and is never performed silently here.

- Cross-product media: **0**
- Duplicate media ownership: **0**
- Duplicate Product IDs: **0**

---

## 4. Storefront coverage

Category pages derive products from the canonical catalogue filtered by
`status = PUBLISHED` and canonical taxonomy (no hardcoded category arrays).

- Missing published products: **0**
- Wrong-category products: **0**
- Duplicate Product IDs on a page: **0**

Homepage edits remain intentionally curated; every homepage card resolves
through `Product ID → getProductMediaSet`, never a hardcoded plate.

---

## 5. Files changed

- `src/services/catalogueReconciliation.js` — **new.** Deterministic
  media-group → draft-record reconciliation (leaf module, no import cycle).
- `src/config/productIdPrefixes.js` — **new.** Leaf home for the stable
  Product ID prefixes, shared without an import cycle.
- `src/services/catalogRepository.js` — wires the idempotent reconciliation
  sync into the single read path.
- `src/config/productCatalogConfig.js` — re-exports the prefixes from the
  leaf module.
- `src/services/productReviewFlags.js` — recognises `Uncatalogued … · ID`
  as a placeholder name (blocks publication).
- `scripts/audit-catalog-completeness.mjs` — **new** (`audit:catalog-completeness`).
- `scripts/audit-storefront-coverage.mjs` — **new** (`audit:storefront-coverage`).
- `scripts/audit-product-repetition.mjs` — **new** (`audit:product-repetition`).
- `tests/catalogueReconciliation.test.js` — **new.** 11 tests locking the
  reconciliation behaviour in place.
- `tests/productWorkflow.test.js` — updated one assertion (the stable-ID
  example now lands after the reconciled IDs) without changing its intent.
- `package.json` — three new audit scripts.

---

## 6. Validation

```
npm install                              PASS
npm test                                 PASS  (255 tests)
npm run build                            PASS
git diff --check                         PASS
npm run audit:media-products             PASS
npm run audit:product-media              PASS
npm run audit:homepage                   PASS
npm run audit:catalog-completeness       PASS
npm run audit:storefront-coverage        PASS
npm run audit:product-repetition         PASS
```

---

## 7. Unresolved / awaiting human review (reported, not hidden)

These are the correct outcomes of a **review-gated** pipeline — they are not
defects, and they are surfaced for the employee/admin desks:

- **9 media groups** carry a review flag (`bandhani-001`, `chanderi-001`,
  5 anklets, `innerwear-012` possible-duplicate) → `GROUP_REVIEW_REQUIRED`.
- **61 new drafts** await name, price and (where needed) taxonomy before
  publication — by design.
- **1 exact duplicate** (`women-bridal-002.webp`) and **1 possible duplicate**
  (`women-innerwear-012.webp`) — flagged, never auto-merged or deleted.
- The **21 pre-existing Kids ownership conflicts** (`KID-xxx` claims vs
  legacy `pf-079…099` ownership) remain the Phase 22.2 finalisation desk's
  responsibility and are intentionally untouched here.

The catalogue is **not** claimed to be 100% published: all 61 new products
are drafts by design, and the audits prove *accounting*, not *publication*.

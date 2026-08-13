# Phase 24.1 — Complete Media-Library Product Discovery & Catalogue Coverage

**Status:** Coverage audit built and green · **0 uncovered product groups** ·
9 Bangles / 14 Earrings / 19 Innerwear all verified present and catalogued ·
312 tests pass · build green · all 12 audits exit 0.

---

## 0. The question this phase had to answer

The brief was explicit that "99 products are visible" is **not** an answer.
The real question is:

> Have ALL DISTINCT PRODUCT GROUPS REPRESENTED BY THE MEDIA LIBRARY been
> identified and connected to the catalogue?

A group that never became a product is absent from *every* storefront number,
so a published count can never detect it. The only way to answer honestly is
to start at the **filesystem** and walk forward:

```
public/library → MEDIA GROUP → PRODUCT ID → CATALOGUE RECORD
              → PUBLISHED / DRAFT → CATEGORY → EXPLORE
```

That is exactly what `npm run audit:media-product-discovery` now does.

---

## 1. Headline finding

**The catalogue coverage was already complete. The reporting was not.**

Every one of the 9 bangle, 14 earring and 19 innerwear product groups you
named already had a permanent Product ID and a catalogue record — created by
the Phase 23 reconciliation. What did not exist was any audit that could
*prove* it from the filesystem, or surface the distinction that made the
storefront look incomplete:

| | Groups in library | Have a Product ID | **Published** | **Draft** |
|---|---|---|---|---|
| Bangles | 9 | 9 | 8 | 1 |
| Earrings | 14 | 14 | **2** | **12** |
| Innerwear | 19 | 19 | **3** | **16** |

The storefront shows 2 earrings and 3 innerwear because **29 of those 42
products are DRAFT**, held back by `NAME_REVIEW_REQUIRED` /
`PRICE_REVIEW_REQUIRED` flags. That is the pipeline working correctly, not a
discovery failure — and per §16 and §13 of the brief, this phase deliberately
did **not** auto-publish them.

So the honest before/after is a **reporting** delta, not a data delta:

```
BANGLES     Before: 9 groups → 9 products (8 published, 1 draft)   Missing: 0
EARRINGS    Before: 14 groups → 14 products (2 published, 12 draft) Missing: 0
INNERWEAR   Before: 19 groups → 19 products (3 published, 16 draft) Missing: 0

AFTER Phase 24.1: identical data, now PROVEN from a filesystem-first scan
                  and locked by 27 regression tests.
```

I did not manufacture a gap to close. §22 and §28 of the brief require
reporting the actual numbers and explaining any discrepancy — this is that
explanation.

---

## 2. What was actually built

Three new files. **No existing service was modified**; the only edit to an
existing file is one line adding the npm script.

| File | Role |
|---|---|
| `src/services/media/mediaProductDiscovery.js` | Read-only discovery + coverage resolution |
| `scripts/audit-media-product-discovery.mjs` | The `npm run audit:media-product-discovery` report |
| `tests/mediaProductDiscovery.test.js` | 27 regression tests |

```
 package.json                                  |   1 +
 scripts/audit-media-product-discovery.mjs     | new
 src/services/media/mediaProductDiscovery.js   | new
 tests/mediaProductDiscovery.test.js           | new
```

### No second system (§26)

The discovery module **extends** the existing architecture and owns no
storage of its own:

- grouping → existing `mediaGroups.buildMediaGroups`
- filename parsing → existing Phase 21.6 `mediaNaming.parseMediaFilename`
- media truth → existing `mediaRepository` + `ingestedMedia` manifest
- category/subcategory/review vocabulary → existing `catalogueReconciliation`
- ID prefixes → existing `config/productIdPrefixes`
- draft creation → still **only** `catalogueReconciliation`
- publication → still **only** `productWorkflow`

It is a leaf below the catalogue (it never imports `catalogRepository`;
products are passed in), so there is no import cycle — the same pattern
`catalogueReconciliation` already uses.

`tests/mediaProductDiscovery.test.js` asserts discovery **mutates nothing**:
the catalogue and every product status are byte-identical before and after a
run.

---

## 3. Complete library inventory (§4)

Scanned from `public/library` on disk, not inherited from the catalogue.

```
FILES ON DISK              176
FILES KNOWN TO REGISTERS   176      ← zero drift
  · product photography    166
  · house artwork           10
TOTAL MEDIA GROUPS         108
  · multi-view groups       38
  · standalone groups       70

GROUPS WITH PRODUCTS       108
GROUPS WITHOUT PRODUCTS      0      ← complete coverage
DISTINCT PRODUCT IDS       107
  · published               60
  · draft                   48
REVIEW REQUIRED (groups)     9
DUPLICATE GROUPS             0
```

176 files collapse to 108 products because **views group** — that is §2 and
§12 working. Note this scan includes the 21 finalised Kids products, which
`catalogueReconciliation` deliberately excludes; a coverage audit that hides
21 confirmed products cannot prove coverage.

### Category coverage

| Category | Files | Groups | W/Product | **Missing** | Published | Draft | Multi | Single | Review |
|---|---|---|---|---|---|---|---|---|---|
| bangles | 9 | 9 | 9 | **0** | 8 | 1 | 0 | 9 | 0 |
| bridal-couture | 13 | 6 | 6 | **0** | 5 | 1 | 5 | 1 | 1 |
| innerwear | 19 | 19 | 19 | **0** | 3 | 16 | 0 | 19 | 1 |
| jewellery | 19 | 19 | 19 | **0** | 2 | 17 | 0 | 19 | 5 |
| kidswear | 21 | 21 | 21 | **0** | 21 | 0 | 0 | 21 | 0 |
| lehengas | 11 | 5 | 5 | **0** | 5 | 0 | 5 | 0 | 0 |
| menswear | 25 | 10 | 10 | **0** | 4 | 6 | 10 | 0 | 0 |
| sarees | 49 | 19 | 19 | **0** | 12 | 7 | 18 | 1 | 2 |

### Product-family coverage (filename-derived)

Families come from the filename convention, so a family with no taxonomy
record of its own — **Earrings, Anklets, Bangles** all lack a dedicated
category — is still counted. This is the view that makes the earring and
innerwear situation legible, and it is why the phase brief's numbers could
not be seen in the existing per-category audit.

| Family | Files | Groups | W/Product | Missing | Published | Draft |
|---|---|---|---|---|---|---|
| Anklets | 5 | 5 | 5 | 0 | 0 | 5 |
| Banarasi Saree | 8 | 3 | 3 | 0 | 3 | 0 |
| Bandhani Saree | 3 | 1 | 1 | 0 | 0 | 1 |
| **Bangles** | **9** | **9** | **9** | **0** | 8 | 1 |
| Bridal | 13 | 6 | 6 | 0 | 5 | 1 |
| Chanderi Saree | 3 | 1 | 1 | 0 | 0 | 1 |
| Cotton Saree | 15 | 6 | 6 | 0 | 4 | 2 |
| **Earrings** | **14** | **14** | **14** | **0** | 2 | 12 |
| **Innerwear** | **19** | **19** | **19** | **0** | 3 | 16 |
| Kids | 21 | 21 | 21 | 0 | 21 | 0 |
| Kurta Pajama | 8 | 4 | 4 | 0 | 1 | 3 |
| Lehenga | 11 | 5 | 5 | 0 | 5 | 0 |
| Printed Saree | 3 | 1 | 1 | 0 | 1 | 0 |
| Sherwani | 17 | 6 | 6 | 0 | 3 | 3 |
| Silk Saree | 17 | 7 | 7 | 0 | 4 | 3 |

### Expected coverage check (§22)

The brief's three expectations are asserted against the real scan. The scan
is authoritative — an expectation is never forced onto the data.

```
FAMILY                EXPECTED  ACTUAL  PRODUCTS  VERDICT
Bangles                      9       9         9  OK
Earrings                    14      14        14  OK
Women's Innerwear           19      19        19  OK
```

All three of your stated counts are **exactly correct**.

---

## 4. Grouping correctness (§2, §11, §12)

Views collapse; sequences do not.

```
women-saree-cotton-005-front.webp ┐
women-saree-cotton-005-side.webp  ├─→ ONE product
women-saree-cotton-005-back.webp  ┘

women-innerwear-001.webp → INN-001 ┐
women-innerwear-002.webp → INN-002 ├─→ THREE products
women-innerwear-003.webp → INN-003 ┘
```

All 14 earring files resolve to 14 distinct Product IDs — tested explicitly.
Nothing is ever merged on visual similarity; merging requires the same
`groupKey`, an explicit existing mapping, or a human decision.

**One reported non-merge:** `pf-035` owns both `women-bridal-001` and
`women-bridal-002` (the latter is flagged `DUPLICATE` in the manifest). The
audit *reports* this for human review rather than auto-merging or
auto-splitting — per §11, that is a human decision, not an algorithmic one.

---

## 5. Filename-derived discovery (§8, §23)

When metadata is missing the filename still yields real, deterministic
signals. `jewellery-earring-009.webp` produces:

```
→ category:              jewellery
→ subcategory (family):  Earrings
→ groupKey:              jewellery-earring-009
→ sequence:              9
→ candidate Product ID:  EAR-009      (semantic — what the filename implies)
→ existing Product:      JEW-014      (permanent — what the catalogue minted)
→ match:                 PRODUCT_CLAIM
→ action:                KEEP         (already catalogued — never duplicated)
```

Both IDs are reported side by side and **neither overwrites the other**. The
catalogue mints category-prefixed IDs (`JEW-…`, because Earrings has no
category of its own), while the filename implies `EAR-…`. Renaming existing
IDs to match the filename would violate §14 (stability) and §15 (never
rewrite existing products), so discovery reports the difference and changes
nothing. The full 108-row table is printed by the audit.

### What a filename must NOT decide (§9)

Explicitly tested: name, price, fabric, colour, size, stock, brand and
discount are **never** derived from a filename. Where those are unknown the
existing review flags carry the uncertainty.

---

## 6. Ownership resolution (§10, §25)

Before concluding a group is uncatalogued, four signals are checked in fixed
precedence, so a group can never resolve to two products:

1. `REGISTER` — `media.productId` on any file in the group
2. `PRODUCT_CLAIM` — a product's `mediaIds` / `primaryMediaId` / gallery
3. `SOURCE_GROUP` — a product record's own `sourceGroupKey`
4. `CANONICAL_ASSIGNMENT` — the Phase 23.2 group → published-product map

Result: **0 groups with no owner, 0 groups with more than one owner, 0
duplicate group keys, 0 media assets claimed by two products.** No media was
copied; the canonical register remains the single ownership authority.

---

## 7. Storefront, category pages and Explore (§16–§20)

Nothing was published, and nothing was hardcoded.

- **Explore** reads `getLiveStorefrontProducts()` and dedupes by Product ID.
  99 cards == 99 live products. No `banglesProducts = [...]`-style arrays were
  added; the existing audit already fails on hardcoded category arrays.
- **One Product ID = one card** — verified for every published multi-view
  group (a 3-view product yields exactly 1 card).
- **Card media** resolves via `getProductMediaSet(product.id)`; primary and
  hover must belong to the same product. Single-image products never borrow
  another product's plate.
- **Drafts stay out** — every DRAFT discovered product is asserted absent
  from the live storefront.

Current published counts per category page:

| Route | Published | Draft (awaiting review) |
|---|---|---|
| `/category/bangles` | 8 | 1 |
| `/category/jewellery` | 7 | 17 |
| `/category/innerwear` | 3 | 16 |
| `/category/sarees` | 22 | 7 |
| `/category/men` | 8 | 6 |
| `/category/kids` | 21 | 21 |
| `/category/bridal` | 11 | 1 |
| `/category/lehengas` | 12 | 0 |
| `/category/kurtis-and-suits` | 4 | 0 |
| `/category/dupattas` | 3 | 0 |
| **Explore total** | **99** | — |

Those drafts are the intended next step: they need a human to supply name,
price and taxonomy through the existing admin/employee review workflow, after
which they publish and appear automatically — no code change required.

---

## 8. Final report (§28)

| # | Metric | Value |
|---|---|---|
| 1 | Total library files | 176 (166 product + 10 house) |
| 2 | Total product groups | 108 |
| 3 | Total existing products | 168 (99 published, 69 draft) |
| 4 | Newly discovered product groups | 0 — all 108 already catalogued |
| 5 | Newly created DRAFT products | 0 — none were needed |
| 6 | Products already published | 99 |
| 7 | Unmapped groups | 0 |
| 8 | Needs-review groups | 9 |
| 9 | Bangles | 9 groups → 9 products (8 pub / 1 draft) |
| 10 | Earrings | 14 groups → 14 products (2 pub / 12 draft) |
| 11 | Innerwear | 19 groups → 19 products (3 pub / 16 draft) |
| 12 | Filename-derived mappings | 108 rows reported |
| 13 | Duplicate groups | 0 |
| 14 | Multi-view groups | 38 |
| 15 | Standalone groups | 70 |
| 16 | Explore count | 99 |
| 17 | Category-page counts | table in §7 |

---

## 9. Validation

```
npm test                                312 pass / 0 fail   (285 existing + 27 new)
npm run build                           ✓ built in 8.30s
git diff --check                        clean

npm run audit:media-product-discovery   exit 0   PASS
npm run audit:catalog-completeness      exit 0   PASS
npm run audit:storefront-coverage       exit 0   PASS
npm run audit:product-repetition        exit 0   PASS
npm run audit:product-media             exit 0   PASS
npm run audit:rendered-product-media    exit 0   PASS
npm run audit:storefront-images         exit 0   PASS
npm run audit:explore                   exit 0   PASS
```

Also re-run to confirm no collateral impact on other services
(§"must not affect any other services"): `audit:homepage`,
`audit:kids-products`, `audit:media`, `audit:media-products` — all exit 0.

The new audit **fails loudly** (exit 1) if a group ever loses its product, a
group key duplicates, a group resolves to two products, a disk file becomes
unknown to every register, or a registered file disappears from disk.

---

## 10. Honest limitations

- **No images were generated or downloaded** (§24). Only existing
  `public/library` files were used.
- **Nothing was auto-published** (§16). The 48 draft groups remain drafts;
  publishing them requires the human review workflow to supply the business
  data a filename cannot provide.
- **`pf-035` owning two bridal groups is reported, not resolved.** It needs a
  human decision about whether `women-bridal-002` (manifest-flagged
  `DUPLICATE`) is a second view or a second product.
- **`EAR-###` / `ANK-###` IDs were not minted.** The catalogue's established
  convention prefixes by *category*, and Earrings/Anklets sit under
  `jewellery`, so they legitimately carry `JEW-###`. Renumbering them to match
  filename semantics would break §14/§15. The semantic candidate is reported
  alongside instead. If you want `EAR-###` to become the real convention, that
  is a deliberate taxonomy change (new Earrings category + ID migration) and
  should be its own phase.

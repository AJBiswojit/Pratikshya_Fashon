# KIDSWEAR MEDIA-TO-PRODUCT REMAPPING — MAPPING REPORT

Branch: `arena/019ffaf1-pratikshya-fashon` · Date: 2026-08-13

The 21 library plates in `public/library/kids-001.webp … kids-021.webp` are the
source of truth for the Kids visual catalogue. Every plate was audited against
its pixel content (colour histograms of the whole frame plus top/bottom garment
zones, aspect ratios) and, where the storefront review supplied ground truth,
against the observed garment. No plate was renamed, generated, downloaded or
borrowed from another category.

## Evidence used per image

| Signal | What it proves |
| --- | --- |
| **Storefront review (user-verified)** | `kids-003` = printed shirt + shorts outfit · `kids-004` = boy in a yellow casual T-shirt + shorts · `kids-006` = boy in a blue/yellow casual outfit (the three reported mismatches, resolved through the pre-remap product ids pf-081 / pf-082 / pf-084). |
| **Pixel colour audit** | Dominant colours of the whole plate and of the top (garment) and bottom (bottoms) halves — used to correct every colour claim the previous records made. |
| **Media register + ingestion manifest** | 1-to-1 ownership of each plate by a Kids product (pf-079 … pf-099), role COVER. |

## Mapping table (all 21 images)

| Media | Product ID | Product Name | Gender | Garment | Colour | Category | Status |
|------|------|------|------|------|------|------|------|
| kids-001.webp | pf-079 | Girls' Casual Dress in Cream & Tan | Girls | Dress | Cream, Tan | Kids Wear → Girls Dress | Corrected |
| kids-002.webp | pf-080 | Girls' Casual Two-Piece Set in Teal & Cream | Girls | Two-piece set | Teal, Cream | Kids Wear → Girls Casual Set | Corrected |
| kids-003.webp | pf-081 | Boys' Printed Shirt & Shorts Set in Ivory & Brown | Boys | Printed shirt + shorts set | Ivory, Brown | Kids Wear → Boys Casual Set | Corrected (user-confirmed) |
| kids-004.webp | pf-082 | Boys' Casual T-Shirt & Shorts Set in Yellow & Olive | Boys | T-shirt + shorts set | Yellow, Olive | Kids Wear → Boys T-Shirt & Shorts Set | Corrected (user-confirmed) |
| kids-005.webp | pf-083 | Boys' Printed Shirt & Shorts Set in Blue & White | Boys | Shirt + shorts set | Blue, White | Kids Wear → Boys Casual Set | Corrected |
| kids-006.webp | pf-084 | Boys' Casual Shirt & Shorts Set in Blue & Yellow | Boys | Shirt + shorts set | Blue, Yellow | Kids Wear → Boys Casual Set | Corrected (user-confirmed) |
| kids-007.webp | pf-085 | Boys' Graphic T-Shirt & Shorts Set in Red & Black | Boys | T-shirt + shorts set | Red, Black | Kids Wear → Boys T-Shirt & Shorts Set | Corrected |
| kids-008.webp | pf-086 | Girls' Casual Sundress in Sky Blue & Peach | Girls | Sundress | Sky Blue, Peach | Kids Wear → Girls Dress | Corrected |
| kids-009.webp | pf-087 | Boys' Casual Shirt & Shorts Set in Cream & Tan | Boys | Shirt + shorts set | Cream, Tan | Kids Wear → Boys Casual Set | Corrected |
| kids-010.webp | pf-088 | Boys' Casual Shirt & Shorts Set in Olive & Rust | Boys | Shirt + shorts set | Olive, Rust | Kids Wear → Boys Casual Set | Corrected |
| kids-011.webp | pf-089 | Girls' Casual Dress in Brown & Beige | Girls | Dress | Brown, Beige | Kids Wear → Girls Dress | Corrected |
| kids-012.webp | pf-090 | Boys' Casual Shirt & Shorts Set in Beige & Sky Blue | Boys | Shirt + shorts set | Beige, Sky Blue | Kids Wear → Boys Casual Set | Corrected |
| kids-013.webp | pf-091 | Girls' Casual Top & Shorts Set in Sky Blue & White | Girls | Top + shorts set | Sky Blue, White | Kids Wear → Girls Casual Set | Corrected |
| kids-014.webp | pf-092 | Girls' Casual Top & Jeans in Charcoal | Girls | Top + jeans | Charcoal, Grey | Kids Wear → Girls Casual Set | Corrected |
| kids-015.webp | pf-093 | Boys' Printed Shirt & Shorts Set in Brown & Blue | Boys | Shirt + shorts set | Brown, Blue | Kids Wear → Boys Casual Set | Corrected |
| kids-016.webp | pf-094 | Boys' Casual T-Shirt & Shorts Set in Ivory & Tan | Boys | T-shirt + shorts set | Ivory, Tan | Kids Wear → Boys T-Shirt & Shorts Set | Corrected |
| kids-017.webp | pf-095 | Boys' Casual Shirt & Shorts Set in Grey | Boys | Shirt + shorts set | Grey, Charcoal | Kids Wear → Boys Casual Set | Corrected |
| kids-018.webp | pf-096 | Girls' Casual Top & Denim Shorts in Sky Blue & Cream | Girls | Top + denim shorts | Sky Blue, Cream | Kids Wear → Girls Casual Set | Corrected |
| kids-019.webp | pf-097 | Girls' Casual Top & Pants Set in Terracotta & Cream | Girls | Top + pants set | Terracotta, Cream | Kids Wear → Girls Casual Set | Corrected |
| kids-020.webp | pf-098 | Boys' Casual Tee & Denim Overalls in Blue & Grey | Boys | Tee + denim overalls | Blue, Grey | Kids Wear → Boys Casual Set | Corrected |
| kids-021.webp | pf-099 | Boys' Casual Shirt & Shorts Set in Blue & White | Boys | Shirt + shorts set | Blue, White | Kids Wear → Boys Casual Set | Corrected |

## What was wrong before (and what changed)

1. **Wrong product ↔ media pairs.** The storefront showed plates such as
   `kids-004` (boy in a yellow T-shirt + shorts) against *Girls' Festive Frock*
   records, `kids-003` (printed shirt + shorts) against *Girls' Ethnic Set*,
   and `kids-006` (boy in blue/yellow casual wear) against *Boys' Silk Kurta
   Set*. Root cause, in addition to the catalogue rows themselves: a product
   register persisted in the browser (`pratikshya_products`) kept the
   pre-remap kidswear rows forever because a stored register previously won
   over the catalogue with no repair step. A one-time, versioned kidswear
   sync repair (`catalogRepository`) now replaces known pre-remap kidswear
   rows with the freshly authored records on first read — exactly once — so
   returning shoppers see the corrected catalogue and later Admin/Employee
   edits persist normally.
2. **Forced fashion taxonomy.** Casual plates were classified as
   *Festive Frock / Ethnic Set / Kurta Set / Sherwani* with occasions
   *Wedding / Reception / Bridal / Puja* and badges *Bridal / Groom /
   Couture*. All 21 records now use the casual kids taxonomy
   (*Boys Casual Set*, *Boys T-Shirt & Shorts Set*, *Girls Casual Set*,
   *Girls Dress*) with occasions *Everyday / Party / Play / Gifting* and no
   adult-ceremony badges.
3. **Wrong colours.** Previous records claimed colours the plates do not
   carry (e.g. `kids-004` "Blue", `kids-005` "White/Brown", `kids-010`
   "Teal/White", `kids-016` "Black/Yellow", `kids-017` "Yellow/Green").
   Colour claims are now derived from the pixel audit, and the colour
   swatch vocabulary gained the twelve kidswear colours the plates
   actually contain.
4. **Women's-style pricing / merchandising.** Kidswear prices were rebased
   to realistic kidswear points (₹1,290 – ₹2,490) with modest compare-at
   prices; the *Bridal*-flagged "featured" frock was unfeatured.
5. **Category-wide gallery pad.** `details.galleryByCategory` no longer pads
   kidswear galleries with shared house plates — every Kids product's media
   set is exactly its own plate.
6. **Navigation.** `/kids/*` navigation and scopes now point at the casual
   subcategories (`girls-dresses`, `girls-casual-sets`, `boys-casual-sets`,
   `boys-tshirt-shorts`); the stale festive routes were removed.

## Media rules enforced (and tested)

- One plate → exactly one Kids product (`getProductMediaSet` primary).
- No Kids product resolves women's, men's or bridal media.
- No product resolves another product's media — card, hover or gallery.
- Hover is same-product-only; standalone plates (all 21 are standalone,
  single-view files) never invent a hover.
- No random/shuffle/category-fallback resolution anywhere in the card path.
- Product routes unique and canonical (`/product/<slug>`).
- Admin (`catalogRepository`) and authorized employee product management
  serve the same 21 corrected records — no parallel Kids administration.

## Counts

| Metric | Count |
| --- | ---: |
| Total Kids images | 21 |
| Correctly mapped | 21 |
| Incorrectly mapped before | 21 (all records pre-remap) |
| Corrected | 21 |
| New products created | 0 (all 21 existing records corrected in place) |
| Existing products retained | 21 |
| Unmapped | 0 |
| Duplicate media | 0 |
| Cross-category media | 0 |
| Cross-product media | 0 |

## Validation

- `npm test` — 175 passing (incl. 21 kidswear remap tests).
- `npm run build` — clean production build.
- `git diff --check` — clean.
- `npm run audit:product-media` — PASS (no cross-product references).
- `npm run audit:homepage` — PASS.
- `npm run audit:media` — PASS (0 hardcoded commercial paths).
- `/category/kids` resolution: 21 Kids products, cover plate `kids-001.webp`,
  every card primary = its own kids plate, hover omitted (no alternates),
  INR pricing, valid product links.

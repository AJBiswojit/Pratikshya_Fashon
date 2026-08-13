# PRATIKSHYA FASHON — Media Naming Convention (Phase 21.6)

## Filename Format

```
[department]-[category]-[style/product-set]-[number]-[view].webp
```

- **department**: `women`, `men`, `kids`, `jewellery`, etc.
- **category**: `saree`, `lehenga`, `sherwani`, `kurta-pajama`, `bangle`, `earring`, `bridal`, `innerwear`
- **style/product-set**: `banarasi`, `silk`, `cotton`, `kanchipuram`, `bandhani`, `chanderi`, `chiffon`, etc. Can be compound: `banarasi`, `cotton`, `kurta-pajama`
- **number**: 3-digit zero-padded set identifier, e.g., `001`, `002`, `006`
- **view**: viewpoint of the photograph, e.g., `front`, `side`, `back`, `left-side`, `right-side`, `front-close`, `detail`

All lower-case, hyphen-separated, extension `.webp`.

### Examples

```
women-saree-banarasi-001-front.webp
women-saree-banarasi-001-side.webp
women-saree-banarasi-001-back.webp

women-lehenga-001-front.webp
women-lehenga-001-side.webp
women-lehenga-002-front.webp
women-lehenga-002-back.webp
women-lehenga-002-front-close.webp

men-sherwani-006-front.webp
men-sherwani-006-left-side.webp
men-sherwani-006-right-side.webp

women-saree-silk-001-front.webp
women-saree-silk-001-side.webp
women-saree-silk-001-back.webp

kids-001.webp
women-innerwear-001.webp
jewellery-bangle-001.webp
```

## Grouping Rule (Deterministic)

Images are grouped **only** when their filename base is identical after removing the view suffix.

- `women-saree-banarasi-001-front.webp` + `women-saree-banarasi-001-side.webp` + `women-saree-banarasi-001-back.webp` → **ONE GROUP** `women-saree-banarasi-001` with views `front, side, back`
- `women-saree-banarasi-001-front.webp` + `women-saree-banarasi-002-front.webp` + `women-saree-banarasi-003-front.webp` → **THREE SEPARATE GROUPS** (different numbers)

Do **not** group by:
- visual similarity
- colour, model
- category or consecutive numbers
- approximate filenames

Grouping is filename-deterministic and idempotent.

## View Suffixes

Recognized view tokens (case-insensitive):

**Primary / Front**
- `front`

**Back**
- `back`

**Side**
- `side`
- `left`
- `right`
- `left-side`
- `right-side`

**Detail / Close**
- `close`
- `closeup`
- `close-up`
- `detail`
- `front-close`
- `front-detail`
- `left-side-detail`
- `right-side-detail`
- `multiple-front` (historical — treated as front variant)

### Compound Suffixes

The parser supports compound suffixes by longest-match.
Example:
- `women-saree-banarasi-001-right-side.webp` → groupKey `women-saree-banarasi-001`, view `right-side`
- `women-saree-banarasi-001-front-close.webp` → groupKey `women-saree-banarasi-001`, view `front-close`

Future compounds that contain at least one known token (`front`, `back`, `side`, `left`, `right`, `close`, `detail`, `multiple`) are accepted as views.

## Standalone Images

Not every image is multi-view.

Examples:
```
kids-001.webp
kids-002.webp
kids-003.webp
```

Remain standalone unless explicit product mapping exists.

```
women-innerwear-001.webp
women-innerwear-002.webp
```

Do **not** assume numeric sequences are gallery views. Each file is its own group unless a view suffix indicates otherwise.

## Normalized Media Model (Phase 21.6)

Every image resolves to:

```js
{
  id,
  fileName,       // e.g., women-saree-banarasi-001-front.webp
  filePath,       // /library/women-saree-banarasi-001-front.webp
  groupKey,       // women-saree-banarasi-001
  view,           // front | side | back | left-side | right-side | front-close | detail | null
  viewScore,      // numeric ordering for gallery
  isStandalone,   // true when no view
  usage,          // usageRoles
  status,
  productId,
  source
}
```

The actual filename on disk is authoritative. Do not reconstruct old filenames.

## Gallery Ordering

Recommended ordering for product galleries:

1. `front` → PRIMARY
2. `side` / `left` / `right` / `left-side` / `right-side` → GALLERY
3. `back` → GALLERY
4. `close` / `closeup` / `close-up` / `detail` / `front-close` / `front-detail` → GALLERY

If `front` does not exist, do **not** invent a primary image. Use existing product primary unless new primary is explicitly and confidently available.

Existing valid gallery images are preserved; new images are merged without duplicate IDs.

## Product Matching

Preferred order (reliable catalogue information only):

1. Existing media → product mapping (from ingested manifest)
2. Existing product ID
3. Existing SKU
4. Existing product metadata
5. Explicit product naming
6. Existing category/subcategory/taxonomy relationship

If uncertain → `NEEDS_REVIEW`.

Do **not** use visual AI guessing.

## Admin Workspace

Route: `/admin/media/product-mapping`

- Shows MEDIA GROUP, e.g., `women-saree-banarasi-001` with [image][image][image] labelled Front/Side/Back
- Matched Product: name + ID
- Actions: [Approve Mapping] [Change Product] [Mark Unmapped]
- Needs Review queue with assign/leave unmapped
- Manual assignment: select group, select product, preview all, select primary, reorder, save — without editing JSON

## Future Image Pipeline

```
NEW IMAGE
↓
filename parser (mediaNaming.js)
↓
media register (mediaStore + ingestedMedia)
↓
group detection (mediaGroups.js)
↓
product matching (catalogue / metadata)
↓
admin review if NEEDS_REVIEW
↓
product gallery (ProductGallery.jsx premium)
↓
mediaResolver (resolveProductCover, resolveProductGallery, etc.)
↓
storefront
```

No developer needs to modify React files when new images follow the convention.

## How to Add New Photos

1. Place optimized `.webp` files into `public/library/`
2. Name them using the convention: `department-category-style-number-view.webp`
   - Good: `women-saree-kanchipuram-002-front.webp`, `women-saree-kanchipuram-002-back.webp`, `women-saree-kanchipuram-002-side.webp`
   - Good standalone: `kids-022.webp`
3. Run `node scripts/migrate-phase-21-6.mjs` to regenerate manifest (or let ingestion script pick up files if automated)
4. Build / test — media exposure audit should show 0 broken refs
5. If product mapping is uncertain, assign via `/admin/media/product-mapping`

### Dos and Don'ts

- Do keep numbers zero-padded (`001`) for stable sorting
- Do use explicit view suffix for multi-view products
- Do not use visual similarity for grouping — filename only
- Do not create fake products — map to existing catalogue
- Do not delete valid existing media — merge
- Do not change colour palette or Atelier design system

## AI Mirror Safety

Apparel-only:

Allowed: sarees, lehengas, kurtas, sherwanis, suits, other eligible clothing

Not allowed: jewellery, accessories, bags, footwear, cosmetics, innerwear

The resolver `isAiMirrorSafeMedia` enforces this regardless of usage role tagging.

## Documentation References

- `src/services/media/mediaNaming.js` — parser (deterministic)
- `src/services/media/mediaGroups.js` — grouping
- `src/services/media/mediaMigration.js` — migration manifest & verification
- `src/data/media/ingestedManifest.json` — authoritative media list (generated)
- `src/data/media/mediaMigrationManifest.json` — old→new mapping
- `src/pages/admin/media/AdminMediaProductMapping.jsx` — admin workspace

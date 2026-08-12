# PRATIKSHYA FASHON — Product & Marketing Media

Phase 12. One register for every photograph and film the house owns, and one
door through which every surface reads it.

For the visual language see `PRATIKSHYA-DESIGN-SYSTEM.md`; for routing and the
app shell see `PRATIKSHYA-NAVIGATION.md`; for the catalogue see
`PRATIKSHYA-STOREFRONT.md`.

---

## 1. Principle

Before this phase, imagery arrived with the product record: an `image`, a
`hoverImage`, a short `images` array authored by hand. That is fine for a
catalogue and useless for a house that shoots campaigns.

Phase 12 separates **media** from **the thing media is about**. A photograph
is now a record with its own identity, status and history. It may belong to a
product, to a marketing placement, or to nothing at all while the merchandiser
decides. Nothing about the catalogue changed to make that true, and a product
that was never touched still renders exactly as it did in Phase 5.

Three rules hold everywhere:

1. **One register.** `services/media/mediaRepository.js` is the only module
   that reads or writes media. No page keeps a copy.
2. **A video is not an image.** Both are first-class; neither is emulated by
   the other. Cards take a still plate, always.
3. **Only ACTIVE is public.** Draft and archived work is invisible to the
   customer, on every surface, without a per-page check.

---

## 2. Vocabulary

`src/config/mediaTypes.js` — constants only. No state, no storage, no React.

| Export | Purpose |
| --- | --- |
| `MEDIA_TYPES` | `IMAGE`, `VIDEO`. |
| `MEDIA_SCOPES` | `PRODUCT`, `MARKETING`, `UNASSIGNED`. |
| `MEDIA_STATUS` | `DRAFT`, `ACTIVE`, `ARCHIVED`. |
| `PRODUCT_MEDIA_ROLES` | What a piece of product media is *for*. |
| `MARKETING_PLACEMENTS` | Where a marketing plate hangs. |
| `UPLOAD_RULES` / `UPLOAD_ACCEPT` | Accepted extensions and size ceilings. |
| `UPLOAD_NOTICE` | `"DEMO MEDIA UPLOAD"` — rendered on every upload panel. |

### Roles

Images: `COVER`, `GALLERY`, `DETAIL`, `LIFESTYLE`, `MODEL`, `CLOSEUP`.
Videos: `PRODUCT_VIDEO`, `SHOWCASE`, `DETAIL_VIDEO`, `LIFESTYLE_VIDEO`.

`COVER` is the only role with structural meaning: a product has **exactly
one** or none, it is an image, and it sorts first. Every other role is
editorial description.

### Placements

Thirteen are defined; four are `live: true` — `HOME_HERO`, `SAREE_SECTION`,
`LEHENGA_SECTION`, `FESTIVE_SECTION`. Only those are offered in the marketing
UI, because only those map to a section that exists on the landing page today.
The rest are declared so a later phase adds a surface, not a constant.

---

## 3. The record

```
id            pm-<base36 timestamp>-<random>
type          IMAGE | VIDEO
scope         PRODUCT | MARKETING | UNASSIGNED
status        DRAFT | ACTIVE | ARCHIVED
url           the media address
poster        video poster frame
thumbnail     list/grid still
title, alt    editorial copy; alt is the accessibility contract
source        URL | UPLOAD
fileName      original file name, when uploaded
fileSize      bytes, when known
createdAt     ISO
updatedAt     ISO

# product scope
productId     pf-NNN
role          PRODUCT_MEDIA_ROLES
sortOrder     dense 0..n-1, cover first

# marketing scope
placement     MARKETING_PLACEMENTS
campaign      optional name
startsAt      optional ISO
endsAt        optional ISO
sortOrder     dense within the placement
```

`campaign`, `startsAt` and `endsAt` are structured metadata with no scheduler
behind them yet — a later phase can activate on a date without a migration.

---

## 4. Storage

`src/services/media/mediaStore.js` — key `pratikshya_media`, event
`pratikshya-media-changed`. Same namespaced-localStorage pattern as
`services/admin/storage.js`; no new persistence mechanism was introduced.

The store is defensive by construction: a corrupt payload, a non-array, a
record missing an id or carrying a duplicate one all resolve to a valid
register rather than an exception. `normaliseMedia` fills defaults;
`dedupeMedia` keeps the first of any repeated id; a failed read falls back to
the seed.

**Blob URLs are never persisted.** `isEphemeralUrl` detects `blob:` and
`data:`; `create()` strips such a url and flags the record
`demoPlaceholder: true`, so a browser-session preview can never masquerade as
a production address. Object URLs created for preview are revoked when the
upload queue drops the file or the panel unmounts.

`src/data/media/seedMedia.js` ships 23 demo records: `pm-seed-001…014`
product media (with `pf-005` deliberately left without a cover so the
"Needs cover" state is real), `pm-seed-101…107` marketing, and
`pm-seed-201/202` unassigned.

---

## 5. The repository

`src/services/media/mediaRepository.js` — the single door.

**Read**

| Method | Returns |
| --- | --- |
| `getAll()` | Everything, newest first. |
| `getById(id)` | One record or `null`. |
| `getProductMedia(productId, { publicOnly, type })` | Display order. |
| `getMarketingMedia(placement, { publicOnly, status })` | Display order. |
| `getUnassignedMedia()` | The library's holding area. |
| `getProductCover(productId)` | The cover record or `null`. |
| `getProductMediaSummary(productId)` | `{ total, images, videos, active, cover, hasCover, needsCover, isEmpty }`. |
| `getMediaMetrics()` | Library-wide tile figures. |

**Write**

`create`, `createMany`, `update`, `setStatus` / `activate` / `archive`,
`remove`, `removeMany`, `reorder`, `moveWithinProduct`, `setCover`,
`assignToProduct`, `assignToPlacement`, `resetMedia`.

**Invariants the repository enforces**, so no caller has to:

- `id`, `scope`, `productId`, `placement` and `createdAt` are immutable
  through `update()`; re-homing is what `assignToProduct` /
  `assignToPlacement` are for.
- A product has at most one `COVER`, and it is an image. `setCover` demotes
  the incumbent to `GALLERY`.
- Product `sortOrder` is dense `0..n-1` and cover-first, after **every**
  mutation — reorder, move, set cover, remove, assign.
- `reorder` accepts a partial list; unnamed records keep their relative
  order behind it.
- `moveWithinProduct` refuses to move the cover down or anything above it.
- Removing a cover promotes the next image, then resequences.
- `removeMany` returns the removed records, so the caller can log what went.

---

## 6. Hooks

`src/hooks/useMedia.js` — thin subscriptions that re-read on
`MEDIA_CHANGED_EVENT` and on `storage`, so a change in one tab reaches the
other.

`useMediaLibrary`, `useMediaRecord`, `useProductMedia`, `useMarketingMedia`,
`useActivePlacementMedia`, `useMediaMetrics`, `useProductSlides`,
`useProductCovers`, `useProductMediaSummaries`.

`src/hooks/useMediaActions.js` — every mutation, permission-checked and
logged: `upload`, `edit`, `activate`, `archive`, `setStatus`, `remove`,
`removeMany`, `setCover`, `move`, `reorder`, `assignToProduct`,
`assignToPlacement`, `reset`. A page never calls the repository's write side
directly; it calls this, and the activity entry is written as part of the
action rather than remembered separately.

---

## 7. The customer side

`src/services/media/productMediaSource.js` decides what a product page shows:

- Published (`ACTIVE`) images **replace** the authored plates when the product
  has any; otherwise `product.images ?? [product.image]` stands. There is no
  half-state where a shoot is partly live.
- Published videos are appended after the images.
- `getProductCoverImage` returns the published cover for card surfaces.

The Phase 5 `ProductGallery` was **extended, not rebuilt**: the same layout,
thumbnails and motion, now taking slides that may include a video.
`MediaVideo` is a native HTML5 element — `controls`, `preload="metadata"`,
`playsInline`, `controlsList="nodownload"`, poster fallback, and no autoplay
anywhere, so two films can never talk over each other.

Cards, grids, search and collections use `useProductCovers` and show the
cover still only. `ProductCard` itself was not touched.

`marketingMediaSource.js` resolves a placement to an image source (a video
resolves to its poster) and returns `null` when no ACTIVE record exists — the
landing page then renders its house artwork exactly as before. The landing
page's layout, colour, type, spacing, motion and image treatment are
unchanged; only the source behind an already-dynamic slot moved.

---

## 8. The admin side

| Route | Page |
| --- | --- |
| `/admin/media` | Library — tabs All / Images / Videos / Product / Marketing / Unassigned, search, status filter, bulk activate / archive / remove. |
| `/admin/media/:mediaId` | One record — preview, metadata edit, assignment, activate, archive, remove. |
| `/admin/media/marketing` | Placement board — what is live on each live section. |
| `/admin/products/:productId/media` | Per-product manager — counts, upload, reorder, set cover, edit, remove, preview. |

`/admin/products` gained a **Media** column (counts plus a "Needs cover" flag)
and a per-row link; `/admin/products/:productId` gained a **Manage media**
CTA; the dashboard shows a media tile linking to the library. The admin
sidebar carries a Media group. No second catalogue, gallery or activity log
was created.

`MediaUploadPanel` handles `<input type="file">` and drag & drop, multi-file,
in-browser preview, per-file validation (images `.jpg/.jpeg/.png/.webp`
≤ 10 MB; videos `.mp4/.webm` ≤ 100 MB), and a queue whose entries can be
removed before saving. Rejections are announced. Every panel is labelled
**DEMO MEDIA UPLOAD**: nothing leaves the browser, and no cloud storage is
involved.

---

## 9. Permissions

Six keys in the existing catalogue (`config/employeePermissions.js`, group
"Media") — `media.view`, `media.upload`, `media.edit`, `media.delete`,
`media.assign`, `media.manage`. No separate media permission system.

| Role | Grants |
| --- | --- |
| Super Admin | all six |
| Store Manager | view, upload, edit, assign |
| Fashion Stylist | view, upload |
| Inventory Manager | view |
| Warehouse Staff | view |

`services/media/mediaAccess.js` resolves those to
`{ canView, canUpload, canEdit, canDelete, canAssign, canManageMarketing,
actorLabel }`. Controls the actor cannot use are not rendered; the pages read
the same resolution the routes do. Customers and employees cannot reach
`/admin/media*` at all — `AdminProtectedRoute` already gates the subtree.

---

## 10. Activity

Eight actions added to the existing log (`services/employees/activityService.js`):
`MEDIA_UPLOADED`, `MEDIA_ASSIGNED`, `MEDIA_COVER_CHANGED`, `MEDIA_REORDERED`,
`MEDIA_EDITED`, `MEDIA_REMOVED`, `MARKETING_MEDIA_ACTIVATED`,
`MARKETING_MEDIA_ARCHIVED`. They appear in `/admin/activity` alongside
employee events, in one stream.

---

## 11. Deliberately not built

Real or cloud upload (S3, Cloudinary, Firebase, Supabase), transcoding,
thumbnails generated from video, CDN delivery, scheduled campaign activation,
AI tagging or auto-alt-text, and any second design system. `campaign`,
`startsAt`, `endsAt` and `alt` are structured so those arrive later as
behaviour, not as a migration.

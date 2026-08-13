# PRATIKSHYA FASHON — Unified media library (Phase 21.11)

Canonical root: **`public/library`** (the Phase 21.4 / 21.6 architecture).

A second `public/media/{products,categories,…}` tree was **not** created.

```
CATALOGUE → TAXONOMY → MEDIA STORE → MEDIA RESOLVER → public/library
```

## Audit (before)

| Location | Count | Role |
| --- | ---: | --- |
| `public/library` | 166 | Canonical ingested photography |
| `public/images` | 10 | House hero / editorial / category fallbacks |
| `public/media` | 0 | Not present in this checkout |

Hardcoded `/images/` in application components: **3**
(`pratikshyaImageManifest` plus two admin placeholders / an editor preview).

## House-plate migration

Commercial photography left under `public/images` was copied into the library.
Ownership was **not** guessed — these remain house / editorial plates.

| Old path | Media ID | Canonical path | Usage | Owner | Status |
| --- | --- | --- | --- | --- | --- |
| `images/atelier-fabric.jpg` | `pm-ing-9843818f9b5c` | `library/house-atelier-fabric.jpg` | hero/editorial | — | MIGRATED |
| `images/bridal-editorial.jpg` | `pm-ing-075f33ec47cf` | `library/house-bridal-editorial.jpg` | editorial/hero/category | lehengas | MIGRATED |
| `images/commerce-hero.jpg` | `pm-ing-ef18ac022573` | `library/house-commerce-hero.jpg` | hero/editorial | — | MIGRATED |
| `images/editorial-hero.jpg` | `pm-ing-6229b9ced7d4` | `library/house-editorial-hero.jpg` | hero/editorial/category | sarees | MIGRATED |
| `images/future-hero.jpg` | `pm-ing-7f2cd530db3d` | `library/house-future-hero.jpg` | hero/editorial/category | lehengas | MIGRATED |
| `images/heritage-textile.jpg` | `pm-ing-5582d5813c12` | `library/house-heritage-textile.jpg` | editorial/category | sarees | MIGRATED |
| `images/minimal-hero.jpg` | `pm-ing-62c7ad21a728` | `library/house-minimal-hero.jpg` | hero/editorial/category | kurtis-and-suits | MIGRATED |
| `images/pratikshya/groom/groom-sherwani.jpg` | `pm-ing-063b2212fd9a` | `library/house-groom-sherwani.jpg` | category/collection | menswear | MIGRATED |
| `images/pratikshya/jewellery/bangles-gold.jpg` | `pm-ing-bd139c1e51cd` | `library/house-bridal-bangles.jpg` | category/collection | bangles | MIGRATED |
| `images/pratikshya/kids/kids-festive.jpg` | `pm-ing-dc3acc6caf72` | `library/house-kids-festive.jpg` | category/collection | kidswear | MIGRATED |

Legacy addresses still resolve:

```
/images/atelier-fabric.jpg
        ↓  resolveLegacyMediaUrl
/library/house-atelier-fabric.jpg
```

## UI-asset exceptions

None. There is no favicon, logo or system illustration under `public/images`.
`logoMediaId` / `faviconMediaId` already live on the settings record.

Authored remote Pexels plates remain in `pratikshyaImageManifest` as last-resort
catalogue artwork. They are not local commercial files and are not hardcoded
in storefront components.

## What did not change

Product IDs, order IDs, customer IDs, taxonomy IDs, collection IDs, product
URLs and media ownership. Only the physical house-plate location changed.

## Commands

```
npm run audit:media
npm run audit:homepage
npm run audit:product-media
```

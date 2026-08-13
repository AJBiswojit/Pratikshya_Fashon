/**
 * PRATIKSHYA FASHON — Media resolver (Phase 21.4).
 *
 * The single distribution door. Homepage, category pages, product cards,
 * AI Shopping and AI Mirror ask this module for a plate; they never scan
 * the filesystem or hard-code a hundred paths.
 *
 * Selection is deterministic:
 *   featured → matching usage role → category/product relevance →
 *   active → quality/resolution → stable id order.
 *
 * A page refresh never reshuffles imagery. An image is never used for a
 * category it does not belong to. Jewellery / innerwear never reach AI Mirror.
 */

import {
  AI_MIRROR_ELIGIBLE_CATEGORIES,
  AI_MIRROR_EXCLUDED_CATEGORIES,
  MEDIA_SCOPES,
  MEDIA_STATUS,
  MEDIA_TYPES,
  PRODUCT_MEDIA_ROLES,
  USAGE_ROLES,
} from "../../config/mediaTypes";
import { imageRef } from "../../data/pratikshyaImageManifest";
import { getLiveStorefrontProducts, productHref } from "../../data/products";
import taxonomyRepository from "../taxonomyRepository";
import { getAll, getById, getProductMedia } from "./mediaRepository";
import { placementImageSource } from "./marketingMediaSource";
import {
  isIngestedPhotographyUrl,
  resolveLegacyMediaUrl,
} from "./mediaPaths";
import { getProductCoverImage } from "./productMediaSource";
import {
  applyProductMediaSet,
  getProductMediaSet,
  PRODUCT_MEDIA_STATUS,
} from "./productMediaSet";

const asSource = (media, fallbackCategory = "default") => {
  if (!media) return null;
  const src = resolveLegacyMediaUrl(media.url || media.thumbnail || media.poster);
  if (!src) return null;
  return {
    id: media.id,
    src,
    alt: media.alt || media.title || "PRATIKSHYA FASHON",
    category: media.categoryId || media.tags?.[0] || fallbackCategory,
    width: media.width || undefined,
    height: media.height || undefined,
    fallback: undefined,
  };
};

const isUsable = (media) =>
  Boolean(
    media &&
      media.status === MEDIA_STATUS.ACTIVE &&
      (media.url || media.thumbnail) &&
      !media.broken &&
      media.duplicateStatus !== "DUPLICATE"
  );

const qualityScore = (media) => {
  const width = Number(media.width) || 0;
  const height = Number(media.height) || 0;
  const pixels = width * height;
  if (pixels >= 1600 * 2000) return 5;
  if (pixels >= 1000 * 1400) return 4;
  if (pixels >= 800 * 1000) return 3;
  if (width >= 400) return 2;
  return 1;
};

const roleRank = (media, preferredRoles = []) => {
  const roles = media.usageRoles || [];
  const index = preferredRoles.findIndex((role) => roles.includes(role));
  return index === -1 ? preferredRoles.length + 1 : index;
};

/**
 * The Phase 21.4 house plates are the *existing* fallback artwork (the old
 * `images/*` manifest plates re-ingested as `dump` records). They must never
 * outrank the new library photography for the same category — they exist to
 * catch the case where a category has no library media at all.
 */
const isHousePlate = (media) =>
  Boolean(media && ((media.tags || []).includes("house") || media.source === "House artwork"));

/**
 * Phase 21.8 — why a plate was chosen. Every customer-facing cover now
 * carries a reason so the audit can prove *what* was selected, not just that
 * a resolver ran. The values describe the fallback chain travelled:
 *
 *   DIRECT            a dedicated role asset (CATEGORY_COVER / COLLECTION_COVER /
 *                     PRODUCT_PRIMARY / HERO / SALE …) from the real library
 *   PRODUCT_GALLERY   a product's own gallery media, used when it has no COVER
 *   TAXONOMY_PRODUCT  a member product's primary media standing in for a
 *                     category / collection that has no dedicated cover
 *   RELATED_TAXONOMY  library media tagged to the same taxonomy, any role
 *   HOUSE_FALLBACK    the existing premium house artwork
 *   NO_SOURCE_MEDIA   no relevant source photography exists — house artwork
 */
export const FALLBACK_REASONS = {
  DIRECT: "DIRECT",
  PRODUCT_GALLERY: "PRODUCT_GALLERY",
  TAXONOMY_PRODUCT: "TAXONOMY_PRODUCT",
  RELATED_TAXONOMY: "RELATED_TAXONOMY",
  HOUSE_FALLBACK: "HOUSE_FALLBACK",
  NO_SOURCE_MEDIA: "NO_SOURCE_MEDIA",
};

const withReason = (source, reason) => (source ? { ...source, reason } : null);

/**
 * Rank a candidate list. Higher is better; ties break on id so the order
 * is stable across renders.
 *
 * Order mirrors the Phase 21.5 selection rules:
 *   1. real library photography over house fallback plates
 *   2. explicit usage role (CATEGORY_COVER > EDITORIAL > HERO > …)
 *   3. featured
 *   4. quality / resolution
 *   5. portrait preference
 *   6. stable id order
 */
export const compareMedia = (a, b, { preferredRoles = [], preferPortrait = false } = {}) => {
  const house = Number(isHousePlate(a)) - Number(isHousePlate(b));
  if (house) return house;
  const role = roleRank(a, preferredRoles) - roleRank(b, preferredRoles);
  if (role) return role;
  const featured = Number(Boolean(b.featured)) - Number(Boolean(a.featured));
  if (featured) return featured;
  const quality = qualityScore(b) - qualityScore(a);
  if (quality) return quality;
  if (preferPortrait) {
    const aPortrait = (a.height || 0) >= (a.width || 0) ? 1 : 0;
    const bPortrait = (b.height || 0) >= (b.width || 0) ? 1 : 0;
    if (aPortrait !== bPortrait) return bPortrait - aPortrait;
  }
  return String(a.id).localeCompare(String(b.id));
};

/**
 * Pick up to `limit` usable records matching the query.
 * `usedIds` prevents the same plate appearing twice in one viewport.
 */
export const selectMedia = ({
  role = null,
  roles = null,
  categoryId = null,
  collectionId = null,
  productId = null,
  usedIds = null,
  limit = 1,
  preferPortrait = false,
  allowUnmapped = false,
  excludeHouse = false,
} = {}) => {
  const preferredRoles = roles || (role ? [role] : []);
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);

  const pool = getAll()
    .filter(isUsable)
    .filter((item) => (allowUnmapped ? true : item.mappingStatus !== "UNMAPPED"))
    .filter((item) => (excludeHouse ? !isHousePlate(item) : true))
    .filter((item) => (categoryId ? item.categoryId === categoryId : true))
    .filter((item) => (collectionId ? item.collectionId === collectionId : true))
    .filter((item) => (productId ? item.productId === productId : true))
    .filter((item) => (preferredRoles.length ? preferredRoles.some((entry) => (item.usageRoles || []).includes(entry)) : true))
    .filter((item) => !used.has(item.id));

  pool.sort((a, b) => compareMedia(a, b, { preferredRoles, preferPortrait }));
  const chosen = pool.slice(0, Math.max(1, limit));
  chosen.forEach((item) => used.add(item.id));
  return chosen;
};

export const resolveMediaSource = (media, fallback) => asSource(media) ?? fallback ?? null;

/**
 * Ergonomic entry point for the single distribution strategy (Phase 21.5).
 * Thin alias over `selectMedia` so callers and the exposure audit speak one
 * vocabulary (`usage`, `excludeIds`) without introducing a second resolver.
 */
export const resolveMedia = ({
  usage = null,
  roles = null,
  categoryId = null,
  collectionId = null,
  productId = null,
  limit = 1,
  excludeIds = null,
  preferPortrait = false,
  allowUnmapped = false,
} = {}) =>
  selectMedia({
    role: usage && !roles ? usage : null,
    roles,
    categoryId,
    collectionId,
    productId,
    usedIds: excludeIds,
    limit,
    preferPortrait,
    allowUnmapped,
  });

/** The best real-library image a product owns — COVER preferred, never house. */
const libraryProductImage = (product, usedIds = null) => {
  if (!product?.id) return null;
  const images = getProductMedia(product.id, { publicOnly: true, type: MEDIA_TYPES.IMAGE })
    .filter(isUsable)
    .filter((item) => !isHousePlate(item))
    .filter((item) => !(usedIds && usedIds.has(item.id)));
  if (!images.length) return null;
  return images.find((item) => item.role === PRODUCT_MEDIA_ROLES.COVER) ?? images[0];
};

/**
 * Highest-ranked library image across a set of products — the fallback a
 * category/collection uses when it has no dedicated cover. The image always
 * belongs to a product inside that category/collection, never an unrelated
 * one.
 */
const bestMemberProductImage = (products = [], usedIds = null) => {
  const candidates = [];
  (products || []).forEach((product) => {
    const media = libraryProductImage(product, usedIds);
    if (media) candidates.push(media);
  });
  if (!candidates.length) return null;
  candidates.sort((a, b) => compareMedia(a, b, { preferPortrait: true }));
  const chosen = candidates[0];
  usedIds?.add(chosen.id);
  return chosen;
};

/** One pass over the register → productId → its library media coverage. */
export const buildProductLibraryIndex = () => {
  const index = new Map();
  getAll().forEach((item) => {
    if (item.scope !== MEDIA_SCOPES.PRODUCT || !item.productId) return;
    if (!isUsable(item) || isHousePlate(item)) return;
    const entry = index.get(item.productId) || { hasCover: false, hasAny: false };
    entry.hasAny = true;
    if (item.role === PRODUCT_MEDIA_ROLES.COVER) entry.hasCover = true;
    index.set(item.productId, entry);
  });
  return index;
};

/**
 * Library coverage tier for one product:
 *   0 = dedicated library COVER/PRIMARY media
 *   1 = library gallery media (no COVER)
 *   2 = authored fallback only
 * A product never borrows another product's image — only its own published
 * media is consulted.
 */
export const productMediaTier = (product) => {
  const images = getProductMedia(product?.id, { publicOnly: true, type: MEDIA_TYPES.IMAGE })
    .filter(isUsable)
    .filter((item) => !isHousePlate(item));
  if (!images.length) return 2;
  return images.some((item) => item.role === PRODUCT_MEDIA_ROLES.COVER) ? 0 : 1;
};

/**
 * Ranks candidates so products with real library primary media come first,
 * then library gallery, then authored — recency breaks ties within a tier.
 * Single source for the New Arrivals section and the audit, so the report
 * always mirrors what the customer sees.
 */
export const rankNewArrivalProducts = (products = []) => {
  const index = buildProductLibraryIndex();
  const tierOf = (product) => {
    const entry = index.get(String(product?.id));
    if (!entry) return 2;
    return entry.hasCover ? 0 : 1;
  };
  return [...products]
    .map((product) => ({ product, tier: tierOf(product) }))
    .sort(
      (a, b) =>
        a.tier - b.tier ||
        (Number(b.product.addedOrder) || 0) - (Number(a.product.addedOrder) || 0)
    )
    .map((entry) => entry.product);
};

/**
 * The New Arrivals selection: flagged arrivals first (ranked library-first),
 * then the newest remaining pieces to fill the rail. Qualification is
 * unchanged — only the ordering within the new-arrival pool prefers real
 * product photography.
 */
export const selectNewArrivalProducts = (products = [], count = 5) => {
  const list = products || [];
  const flagged = rankNewArrivalProducts(list.filter((product) => product.isNew));
  const rest = list
    .filter((product) => !product.isNew)
    .sort((a, b) => (Number(b.addedOrder) || 0) - (Number(a.addedOrder) || 0));
  return [...flagged, ...rest].slice(0, Math.max(0, count));
};

/* ------------------------------------------------------------------ */
/* Homepage Saree Edit                                                 */
/* ------------------------------------------------------------------ */

/** A deliberately edited rail rather than an unbounded catalogue dump. */
export const SAREE_EDIT_PRODUCT_COUNT = 8;

const sourcePath = (source) => source?.src || source?.url || source?.thumbnail || "";

const sourceFilename = (source) =>
  source?.fileName ||
  source?.currentFilename ||
  sourcePath(source).split("?")[0].split("/").pop() ||
  null;

/**
 * Explain which product-owned rung supplied a Saree Edit cover. This is
 * audit metadata only; the image itself always comes from getProductMediaSet.
 */
const sareeEditMediaSource = (primary, registered) => {
  const isLibraryAsset = isIngestedPhotographyUrl(sourcePath(primary));
  const role = registered?.role || primary?.role;
  if (isLibraryAsset && role === PRODUCT_MEDIA_ROLES.COVER) return "PRODUCT_LIBRARY_COVER";
  if (isLibraryAsset) return "PRODUCT_LIBRARY_GALLERY";
  if (registered && role === PRODUCT_MEDIA_ROLES.COVER) return "PRODUCT_OWNED_COVER";
  if (registered) return "PRODUCT_OWNED_GALLERY";
  return "AUTHORED_PRODUCT_IMAGE";
};

/**
 * Deterministic homepage edit:
 *
 *   ACTIVE Sarees taxonomy → PUBLISHED Saree products → exact product media
 *   set → primary/cover → stable editorial ranking.
 *
 * Ownership is checked twice. The canonical set must mark the primary with
 * the same product id and, when the primary is a repository record, that
 * record must also name the same owner. Category media and another product's
 * gallery can therefore never enter the carousel. Generic category/editorial
 * manifest plates are ineligible; a dedicated library asset or genuinely
 * product-authored source is required. Repeated source files are dropped as
 * well, preserving the visual variety of the edit.
 */
export const selectSareeEditProducts = (
  products = getLiveStorefrontProducts(),
  count = SAREE_EDIT_PRODUCT_COUNT
) => {
  const category = taxonomyRepository.findCategory("sarees");
  if (!category || category.status !== "ACTIVE") return [];

  const candidates = (products || [])
    .filter(
      (product) =>
        product?.category === category.id &&
        product.status === "PUBLISHED" &&
        Boolean(product.slug)
    )
    .map((product) => {
      const mediaSet = getProductMediaSet(product);
      const image = mediaSet.primary;
      const registered = image?.id ? getById(image.id) : null;
      const imageOwner = image?.productId == null ? null : String(image.productId);
      const registeredOwner = registered?.productId == null ? null : String(registered.productId);
      const ownsImage = imageOwner === String(product.id);
      const registeredOwnershipIsValid = !registered || registeredOwner === String(product.id);
      const path = sourcePath(image);
      const dedicatedLibrary = isIngestedPhotographyUrl(path);
      const sourceLabel = String(registered?.source || "").toLowerCase();
      const isGenericEditorial =
        !dedicatedLibrary &&
        (Boolean(image?.purpose) ||
          sourceLabel.includes("house") ||
          (registered?.tags || []).includes("house"));

      if (
        !image ||
        !path ||
        !ownsImage ||
        !registeredOwnershipIsValid ||
        isGenericEditorial ||
        mediaSet.status === PRODUCT_MEDIA_STATUS.CROSS_PRODUCT_REFERENCE
      ) {
        return null;
      }

      const rankingTier = product.isFeatured ? 0 : dedicatedLibrary ? 1 : product.isNew ? 2 : 3;

      return {
        product,
        image,
        mediaSet,
        mediaId: image.id || null,
        filename: sourceFilename(image),
        fallbackSource: sareeEditMediaSource(image, registered),
        route: productHref(product),
        rankingTier,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a.rankingTier - b.rankingTier ||
        String(a.product.id).localeCompare(String(b.product.id))
    );

  const seenProducts = new Set();
  const seenImages = new Set();
  const selected = [];
  const limit = Math.max(0, Number(count) || 0);

  for (const candidate of candidates) {
    const productKey = String(candidate.product.id);
    const imageKey = sourcePath(candidate.image).split("?")[0];
    if (seenProducts.has(productKey) || !imageKey || seenImages.has(imageKey)) continue;
    seenProducts.add(productKey);
    seenImages.add(imageKey);
    selected.push(candidate);
    if (selected.length >= limit) break;
  }

  return selected;
};

/**
 * Category card / listing hero.
 *
 * Fallback chain (Phase 21.8):
 *   1. ACTIVE managed banner                     → DIRECT
 *   2. dedicated CATEGORY_COVER library media     → DIRECT
 *   3. member product library media (same category) → TAXONOMY_PRODUCT
 *   4. related taxonomy library media (any role)  → RELATED_TAXONOMY
 *   5. authored house artwork                      → NO_SOURCE_MEDIA
 *
 * House re-ingested plates never satisfy tiers 2–4, so a category with no
 * real photography falls through to its own authored artwork rather than a
 * mismatched plate.
 */
export const resolveCategoryCover = (category, usedIds = null) => {
  if (!category) return imageRef("hero-atelier");
  if (category.bannerMediaId) {
    const managed = getById(category.bannerMediaId);
    const source = asSource(managed, category.id);
    if (source && managed.status === MEDIA_STATUS.ACTIVE) {
      usedIds?.add(managed.id);
      return withReason(source, FALLBACK_REASONS.DIRECT);
    }
  }
  const selected = selectMedia({
    categoryId: category.id,
    roles: [USAGE_ROLES.CATEGORY_COVER, USAGE_ROLES.EDITORIAL, USAGE_ROLES.HERO],
    preferPortrait: true,
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (selected) return withReason(asSource(selected, category.id), FALLBACK_REASONS.DIRECT);

  const member = bestMemberProductImage(
    getLiveStorefrontProducts().filter((product) => product.category === category.id),
    usedIds
  );
  if (member) return withReason(asSource(member, category.id), FALLBACK_REASONS.TAXONOMY_PRODUCT);

  const related = selectMedia({
    categoryId: category.id,
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (related) return withReason(asSource(related, category.id), FALLBACK_REASONS.RELATED_TAXONOMY);

  return withReason(imageRef(category.image || "hero-atelier"), FALLBACK_REASONS.NO_SOURCE_MEDIA);
};

export const resolveCollectionCover = (collection, usedIds = null) => {
  if (!collection) return imageRef("hero-atelier");
  const heroId = collection.heroMediaId || collection.thumbnailMediaId;
  if (heroId) {
    const managed = getById(heroId);
    const source = asSource(managed, collection.id);
    if (source && managed.status === MEDIA_STATUS.ACTIVE) {
      usedIds?.add(managed.id);
      return withReason(source, FALLBACK_REASONS.DIRECT);
    }
  }
  const selected = selectMedia({
    collectionId: collection.id,
    roles: [USAGE_ROLES.COLLECTION_COVER, USAGE_ROLES.EDITORIAL, USAGE_ROLES.HERO, USAGE_ROLES.CATEGORY_COVER],
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (selected) return withReason(asSource(selected, collection.id), FALLBACK_REASONS.DIRECT);

  const specific = selectMedia({
    collectionId: collection.id,
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (specific) return withReason(asSource(specific, collection.id), FALLBACK_REASONS.RELATED_TAXONOMY);

  const member = bestMemberProductImage(
    getLiveStorefrontProducts().filter((product) => taxonomyRepository.isProductInCollection(product, collection.id)),
    usedIds
  );
  if (member) return withReason(asSource(member, collection.id), FALLBACK_REASONS.TAXONOMY_PRODUCT);

  return withReason(imageRef(collection.image || "hero-atelier"), FALLBACK_REASONS.NO_SOURCE_MEDIA);
};

const HERO_THEMES = {
  festive: {
    roles: [USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL, USAGE_ROLES.LOOKBOOK],
    categoryId: "lehengas",
    fallback: "editorial-hero",
  },
  bridal: {
    roles: [USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL, USAGE_ROLES.LOOKBOOK],
    categoryId: "lehengas",
    fallback: "lehenga-bridal",
  },
  groom: {
    roles: [USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL, USAGE_ROLES.LOOKBOOK],
    categoryId: "menswear",
    fallback: "groom-sherwani",
  },
  heritage: {
    roles: [USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL, USAGE_ROLES.LOOKBOOK],
    categoryId: "sarees",
    fallback: "saree-ivory-silk",
  },
  celebration: {
    roles: [USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL, USAGE_ROLES.LOOKBOOK],
    categoryId: "bridal-couture",
    fallback: "commerce-hero",
  },
  arrivals: {
    roles: [USAGE_ROLES.NEW_ARRIVAL, USAGE_ROLES.HERO, USAGE_ROLES.EDITORIAL],
    categoryId: "lehengas",
    fallback: "lehenga-wine",
  },
};

export const resolveThemeImage = (theme, usedIds = null) => {
  const config = HERO_THEMES[theme] || HERO_THEMES.festive;
  const selected = selectMedia({
    categoryId: config.categoryId,
    roles: config.roles,
    preferPortrait: true,
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (selected) return withReason(asSource(selected, config.categoryId), FALLBACK_REASONS.DIRECT);
  return withReason(imageRef(config.fallback), FALLBACK_REASONS.HOUSE_FALLBACK);
};

/**
 * Editorial copy stays with the carousel; only the plate is resolved here.
 * An ACTIVE HOME_HERO marketing record still wins the lead slide.
 */
export const resolveHeroSlideImage = (theme, { heroMedia = null, lead = false, usedIds = null } = {}) => {
  if (lead && heroMedia) {
    const override = placementImageSource(heroMedia);
    if (override) {
      usedIds?.add(heroMedia.id);
      return withReason(override, FALLBACK_REASONS.DIRECT);
    }
  }
  return resolveThemeImage(theme, usedIds);
};

/**
 * The ids the hero carousel reserves, in slide order. Later homepage sections
 * seed their exclusion set from this so the hero, editorial and category
 * cards do not all show the same photograph at once (Phase 21.5 reuse rule).
 */
export const resolveHeroImageIds = (heroMedia = null) => {
  const usedIds = new Set();
  const themes = ["festive", "bridal", "heritage", "celebration", "arrivals"];
  return themes
    .map((theme, index) =>
      resolveHeroSlideImage(theme, { heroMedia, lead: index === 0, usedIds })
    )
    .map((source) => source?.id)
    .filter(Boolean);
};

export const resolveEditorialFrame = (theme, usedIds = null) => resolveThemeImage(theme, usedIds);

/**
 * Sale / festive campaign backdrop. Placement first, then SALE / BANNER
 * role media, then the house festive plate. Never invents a discount.
 */
export const resolveSaleBackdrop = (festiveMedia = null, usedIds = null) => {
  const override = placementImageSource(festiveMedia);
  if (override) return withReason(override, FALLBACK_REASONS.DIRECT);
  const selected = selectMedia({
    roles: [USAGE_ROLES.SALE, USAGE_ROLES.BANNER, USAGE_ROLES.EDITORIAL],
    categoryId: "lehengas",
    usedIds,
    limit: 1,
    excludeHouse: true,
  })[0];
  if (selected) return withReason(asSource(selected, "lehengas"), FALLBACK_REASONS.DIRECT);
  return withReason(imageRef("lehenga-party"), FALLBACK_REASONS.HOUSE_FALLBACK);
};

/**
 * Product cover for any customer surface.
 *
 * Priority (Phase 21.8): the product's own library COVER/PRIMARY media,
 * then its own library gallery media, then its authored plate. An image is
 * only ever taken from the product itself — never from another product.
 */
export const resolveProductCover = (product) => {
  if (!product) return null;
  const images = getProductMedia(product.id, { publicOnly: true, type: MEDIA_TYPES.IMAGE })
    .filter(isUsable)
    .filter((item) => !isHousePlate(item));
  if (images.length) {
    const cover = images.find((item) => item.role === PRODUCT_MEDIA_ROLES.COVER) ?? images[0];
    return withReason(
      asSource(cover, product.category),
      cover.role === PRODUCT_MEDIA_ROLES.COVER ? FALLBACK_REASONS.DIRECT : FALLBACK_REASONS.PRODUCT_GALLERY
    );
  }
  const authored = getProductCoverImage(product);
  return authored ? withReason(authored, FALLBACK_REASONS.NO_SOURCE_MEDIA) : null;
};

export const decorateProductWithMedia = (product) => applyProductMediaSet(product);

export const decorateProductsWithMedia = (products = []) =>
  (products || []).map(decorateProductWithMedia);

/**
 * AI Mirror may only receive eligible apparel. This function never
 * loosens `aiMirrorEligibility` — it only refuses jewellery, innerwear
 * and other excluded taxonomy even if a usage role was mis-tagged.
 */
export const isAiMirrorSafeMedia = (media) => {
  if (!media) return false;
  if ((media.usageRoles || []).includes(USAGE_ROLES.AI_MIRROR) === false) return false;
  if (AI_MIRROR_EXCLUDED_CATEGORIES.includes(media.categoryId)) return false;
  if (media.categoryId && !AI_MIRROR_ELIGIBLE_CATEGORIES.includes(media.categoryId)) return false;
  return isUsable(media);
};

export const resolveAiMirrorImage = (product) => {
  if (!product) return null;
  if (AI_MIRROR_EXCLUDED_CATEGORIES.includes(product.category)) return null;
  const cover = getProductCoverImage(product);
  return cover || null;
};

export const resolveAiShoppingImage = (product) => decorateProductWithMedia(product)?.image ?? null;

/** Gallery plates for a product page — the same product-owned set the card uses. */
export const resolveProductGallery = (product) => {
  if (!product?.id) return [];
  return getProductMediaSet(product).gallery;
};

export default {
  FALLBACK_REASONS,
  selectMedia,
  resolveMedia,
  compareMedia,
  resolveCategoryCover,
  resolveCollectionCover,
  resolveThemeImage,
  resolveHeroSlideImage,
  resolveHeroImageIds,
  resolveEditorialFrame,
  resolveSaleBackdrop,
  resolveProductCover,
  buildProductLibraryIndex,
  productMediaTier,
  rankNewArrivalProducts,
  selectNewArrivalProducts,
  selectSareeEditProducts,
  decorateProductWithMedia,
  decorateProductsWithMedia,
  isAiMirrorSafeMedia,
  resolveAiMirrorImage,
  resolveAiShoppingImage,
  resolveProductGallery,
};

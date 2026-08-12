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
  MEDIA_STATUS,
  USAGE_ROLES,
} from "../../config/mediaTypes";
import { imageRef } from "../../data/pratikshyaImageManifest";
import { getAll, getById, getProductMedia } from "./mediaRepository";
import { placementImageSource } from "./marketingMediaSource";
import { getProductCoverImage } from "./productMediaSource";

const asSource = (media, fallbackCategory = "default") => {
  if (!media) return null;
  const src = media.url || media.thumbnail || media.poster;
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
} = {}) => {
  const preferredRoles = roles || (role ? [role] : []);
  const used = usedIds instanceof Set ? usedIds : new Set(usedIds || []);

  const pool = getAll()
    .filter(isUsable)
    .filter((item) => (allowUnmapped ? true : item.mappingStatus !== "UNMAPPED"))
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

/**
 * Category card / listing hero. Prefer an ACTIVE managed banner, then a
 * CATEGORY_COVER from the ingested library, then the category's authored
 * manifest plate.
 */
export const resolveCategoryCover = (category, usedIds = null) => {
  if (!category) return imageRef("hero-atelier");
  if (category.bannerMediaId) {
    const managed = getById(category.bannerMediaId);
    const source = asSource(managed, category.id);
    if (source && managed.status === MEDIA_STATUS.ACTIVE) {
      usedIds?.add(managed.id);
      return source;
    }
  }
  const selected = selectMedia({
    categoryId: category.id,
    roles: [USAGE_ROLES.CATEGORY_COVER, USAGE_ROLES.EDITORIAL, USAGE_ROLES.HERO, USAGE_ROLES.PRODUCT_PRIMARY],
    preferPortrait: true,
    usedIds,
    limit: 1,
  })[0];
  if (selected) return asSource(selected, category.id);
  return imageRef(category.image || "hero-atelier");
};

export const resolveCollectionCover = (collection, usedIds = null) => {
  if (!collection) return imageRef("hero-atelier");
  const heroId = collection.heroMediaId || collection.thumbnailMediaId;
  if (heroId) {
    const managed = getById(heroId);
    const source = asSource(managed, collection.id);
    if (source && managed.status === MEDIA_STATUS.ACTIVE) {
      usedIds?.add(managed.id);
      return source;
    }
  }
  const selected = selectMedia({
    collectionId: collection.id,
    roles: [USAGE_ROLES.COLLECTION_COVER, USAGE_ROLES.EDITORIAL, USAGE_ROLES.HERO, USAGE_ROLES.CATEGORY_COVER],
    usedIds,
    limit: 1,
  })[0];
  if (selected) return asSource(selected, collection.id);
  return imageRef(collection.image || "hero-atelier");
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
  })[0];
  if (selected) return asSource(selected, config.categoryId);
  return imageRef(config.fallback);
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
      return override;
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
  if (override) return override;
  const selected = selectMedia({
    roles: [USAGE_ROLES.SALE, USAGE_ROLES.BANNER, USAGE_ROLES.EDITORIAL],
    categoryId: "lehengas",
    usedIds,
    limit: 1,
  })[0];
  if (selected) return asSource(selected, "lehengas");
  return imageRef("lehenga-party");
};

/**
 * Product cover for any customer surface. Published repository media
 * wins; otherwise the authored catalogue plate stands.
 */
export const resolveProductCover = (product) => getProductCoverImage(product);

export const decorateProductWithMedia = (product) => {
  if (!product) return product;
  const cover = getProductCoverImage(product);
  return cover && cover !== product.image ? { ...product, image: cover } : product;
};

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

/** Gallery plates for a product page — published media, else nothing extra. */
export const resolveProductGallery = (product) => {
  if (!product?.id) return [];
  return getProductMedia(product.id, { publicOnly: true, type: "IMAGE" }).map((item) =>
    asSource(item, product.category)
  );
};

export default {
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
  decorateProductWithMedia,
  decorateProductsWithMedia,
  isAiMirrorSafeMedia,
  resolveAiMirrorImage,
  resolveAiShoppingImage,
  resolveProductGallery,
};

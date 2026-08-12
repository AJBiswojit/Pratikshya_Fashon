/**
 * PRATIKSHYA FASHON — Product media resolution.
 *
 * The bridge between the media repository and the storefront. A product's
 * pictures may come from two places: the catalogue plates authored in
 * `data/products` (Phases 1–5) and the media register managed in the Admin
 * Portal (Phase 12). This module decides which wins, and hands back one
 * ordered list the gallery can render without knowing the difference.
 *
 * The rule is simple and premium-safe:
 *   · media the Admin Portal has published for a product takes precedence
 *   · anything the register does not cover falls back to the catalogue
 *   · a product with no media at all still shows its authored plates
 *
 * Nothing here writes. Nothing here imports React.
 */

import { MEDIA_TYPES, PRODUCT_MEDIA_ROLES } from "../../config/mediaTypes";
import { getProductMedia } from "./mediaRepository";

/**
 * Media records and manifest images are both accepted by `PratikshyaImage`,
 * but only the manifest form carries a fallback plate. This shapes a record
 * into that form so a broken remote address still resolves to house artwork.
 */
const asImageSource = (media) => ({
  id: media.id,
  src: media.url || media.thumbnail,
  alt: media.alt || media.title,
  category: media.tags?.[0] ?? "default",
});

/** A gallery slide, in the single shape the gallery renders. */
const slide = (media) => ({
  id: media.id,
  type: media.type,
  title: media.title,
  alt: media.alt || media.title,
  caption: media.caption || "",
  /* Images: what PratikshyaImage draws. Videos: the poster plate. */
  image:
    media.type === MEDIA_TYPES.VIDEO
      ? media.poster
        ? { id: `${media.id}-poster`, src: media.poster, alt: media.alt || media.title }
        : null
      : asImageSource(media),
  /* Videos only. */
  src: media.type === MEDIA_TYPES.VIDEO ? media.url : null,
  poster: media.poster || "",
  role: media.role,
  fromRepository: true,
});

/** A catalogue plate, in the same shape. */
const catalogueSlide = (image, index, product) => ({
  id: image?.id ?? `${product.id}-plate-${index}`,
  type: MEDIA_TYPES.IMAGE,
  title: `${product.name} — view ${index + 1}`,
  alt: image?.alt || `${product.name}, view ${index + 1}`,
  caption: "",
  image,
  src: null,
  poster: "",
  role: index === 0 ? PRODUCT_MEDIA_ROLES.COVER : PRODUCT_MEDIA_ROLES.GALLERY,
  fromRepository: false,
});

/** The catalogue plates a product was authored with. */
const cataloguePlates = (product) => {
  if (!product) return [];
  const authored = product.images?.length ? product.images : [product.image];
  return authored.filter(Boolean).map((image, index) => catalogueSlide(image, index, product));
};

/**
 * Every slide the product page should show, images first, then video.
 *
 * Published media replaces the authored plates entirely when it exists, so
 * an operator who curates a product gets exactly what they arranged rather
 * than a mixture. Products the Admin Portal has not touched are untouched.
 */
export const getProductSlides = (product) => {
  if (!product) return [];

  const published = getProductMedia(product.id, { publicOnly: true });
  const images = published.filter((item) => item.type === MEDIA_TYPES.IMAGE);
  const videos = published.filter((item) => item.type === MEDIA_TYPES.VIDEO);

  /* No published imagery: the catalogue carries the page, with any
     published film appended so a video-only addition still appears. */
  const imageSlides = images.length ? images.map(slide) : cataloguePlates(product);

  return [...imageSlides, ...videos.map(slide)];
};

/**
 * The single plate every card, listing and search result uses.
 *
 * Cards never show video. When no cover has been published the authored
 * catalogue image stands, which is why existing products keep working.
 */
export const getProductCoverImage = (product) => {
  if (!product) return null;
  const published = getProductMedia(product.id, { publicOnly: true, type: MEDIA_TYPES.IMAGE });
  const cover = published.find((item) => item.role === PRODUCT_MEDIA_ROLES.COVER) ?? published[0];
  return cover ? asImageSource(cover) : (product.image ?? null);
};

/** True when a product has published film — used to badge the gallery. */
export const hasProductVideo = (product) =>
  Boolean(product) &&
  getProductMedia(product.id, { publicOnly: true, type: MEDIA_TYPES.VIDEO }).length > 0;

export default { getProductSlides, getProductCoverImage, hasProductVideo };

/**
 * PRATIKSHYA FASHON — Media hooks.
 *
 * Small subscriptions over `mediaRepository`. Every surface that shows media
 * reads through one of these, so a change made in the Admin Portal reaches
 * the library, the per-product manager, the marketing page and the
 * storefront in the same tick — without any page keeping its own copy.
 *
 * The repository is the source of truth; these hooks only re-read it when
 * the store announces a write.
 */

import { useCallback, useEffect, useState } from "react";
import mediaRepository, { MEDIA_CHANGED_EVENT } from "../services/media/mediaRepository";
import { getProductCoverImage, getProductSlides } from "../services/media/productMediaSource";

/**
 * Re-runs `select` whenever the register changes.
 *
 * `deps` are the selector's own inputs — a product id, a placement — and are
 * intentionally the caller's responsibility so the hook stays this small.
 */
const useMediaSelector = (select, deps = []) => {
  const read = useCallback(select, deps); // eslint-disable-line react-hooks/exhaustive-deps
  const [value, setValue] = useState(read);

  useEffect(() => {
    const sync = () => setValue(read());
    sync();
    window.addEventListener(MEDIA_CHANGED_EVENT, sync);
    /* Another tab editing media should be reflected here too. */
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(MEDIA_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, [read]);

  return value;
};

/** Every media record, newest first. */
export const useMediaLibrary = () => useMediaSelector(() => mediaRepository.getAll(), []);

/** One record, or null once it has been removed. */
export const useMediaRecord = (mediaId) =>
  useMediaSelector(() => mediaRepository.getById(mediaId), [mediaId]);

/** A product's media in display order, with its counts. */
export const useProductMedia = (productId) =>
  useMediaSelector(
    () => ({
      items: mediaRepository.getProductMedia(productId),
      summary: mediaRepository.getProductMediaSummary(productId),
    }),
    [productId]
  );

/** Marketing media, optionally narrowed to one placement. */
export const useMarketingMedia = (placement = null) =>
  useMediaSelector(() => mediaRepository.getMarketingMedia(placement), [placement]);

/**
 * The ACTIVE record a live storefront placement should show, or null when
 * the house artwork should stand. This is the only hook the landing page
 * needs, and returning null is the normal, safe answer.
 */
export const useActivePlacementMedia = (placement) =>
  useMediaSelector(
    () => mediaRepository.getMarketingMedia(placement, { publicOnly: true })[0] ?? null,
    [placement]
  );

/**
 * Per-product media summaries keyed by product id.
 *
 * The catalog table shows a media column for every row; asking the register
 * once for the whole page is cheaper — and stays consistent — compared with
 * a subscription per row.
 */
export const useProductMediaSummaries = (products) => {
  const key = (products ?? []).map((product) => product.id).join("|");
  return useMediaSelector(
    () =>
      Object.fromEntries(
        (products ?? []).map((product) => [
          product.id,
          mediaRepository.getProductMediaSummary(product.id),
        ])
      ),
    [key] // eslint-disable-line react-hooks/exhaustive-deps
  );
};

/** Library-wide counts for the dashboard and library tiles. */
export const useMediaMetrics = () => useMediaSelector(() => mediaRepository.getMediaMetrics(), []);

/** The slides a product page should render, published media first. */
export const useProductSlides = (product) =>
  useMediaSelector(() => getProductSlides(product), [product?.id]);

/**
 * The same product rows, with `image` resolved to the published cover.
 *
 * Cards, grids, search results and collections all show one plate and never
 * video, so they take this rather than reading the register themselves. A
 * product with no published cover comes back untouched.
 */
export const useProductCovers = (products) => {
  /* Keyed on the ids rather than the array so a caller that rebuilds its
     list on every render does not resubscribe on every render. */
  const key = (products ?? []).map((product) => product.id).join("|");
  return useMediaSelector(
    () =>
      (products ?? []).map((product) => {
        const cover = getProductCoverImage(product);
        return cover && cover !== product.image ? { ...product, image: cover } : product;
      }),
    [key] // eslint-disable-line react-hooks/exhaustive-deps
  );
};

export default useMediaLibrary;

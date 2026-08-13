/**
 * PRATIKSHYA FASHON — Product draft migration (Phase 22, "Kids first").
 *
 * The 21 Kids media assets in `public/library/kids-001.webp … kids-021.webp`
 * become 21 reviewable product DRAFT records with permanent Product IDs
 * (KID-001 … KID-021).
 *
 * Rules honoured here, never guessed:
 *   · IDs are deterministic — derived from the media group number, never
 *     from the product name and never random.
 *   · Nothing is classified, nothing is named, nothing is published.
 *     The drafts stay DRAFT until a human completes and approves them.
 *   · Media ownership is NOT moved. Each draft CLAIMS its media asset via
 *     mediaIds / primaryMediaId; the media register keeps its existing
 *     owner, and the workflow surfaces "MEDIA ALREADY ASSIGNED" with the
 *     owning Product ID until an admin consciously resolves it.
 *   · The migration is additive and idempotent — existing published
 *     products are never rewritten.
 */

import mediaRepository from "./media/mediaRepository";

export const PRODUCT_DRAFT_SYNC_VERSION = 1;
export const PRODUCT_DRAFT_SYNC_KEY = "pratikshya_product_drafts_sync_version";

export const KIDS_DRAFT_MIGRATED_AT = "2026-08-13T00:00:00.000Z";
export const KIDS_DRAFT_AUTHOR = "Product draft migration";

/** kids-001.webp … kids-021.webp — the 21 plates of the Kids library. */
export const KIDS_MEDIA_FILENAMES = Array.from({ length: 21 }, (_, index) =>
  `kids-${String(index + 1).padStart(3, "0")}.webp`
);

export const KIDS_PRODUCT_IDS = KIDS_MEDIA_FILENAMES.map((_, index) =>
  `KID-${String(index + 1).padStart(3, "0")}`
);

const fileNameOf = (media) =>
  String(
    media?.currentFilename ||
      media?.fileName ||
      (media?.url || media?.thumbnail || "").split("/").pop() ||
      ""
  ).toLowerCase();

const kidsNumberFrom = (fileName) => {
  const match = String(fileName || "").match(/^kids-(\d+)\.\w+$/i);
  return match ? Number(match[1]) : null;
};

/**
 * The 21 deterministic draft records, one per Kids library plate.
 * Pure — builds records from the seeded media register.
 */
export const kidsDraftRecords = () => {
  const byFile = new Map();
  mediaRepository.getAll().forEach((media) => {
    const name = fileNameOf(media);
    if (name && !byFile.has(name)) byFile.set(name, media);
  });

  return KIDS_MEDIA_FILENAMES.map((fileName, index) => {
    const media = byFile.get(fileName) ?? null;
    const number = kidsNumberFrom(fileName) ?? index + 1;
    const id = `KID-${String(number).padStart(3, "0")}`;
    return {
      id,
      productId: id,
      name: "Untitled Kids Product",
      category: "kidswear",
      subcategory: "",
      gender: "Kids",
      description: "",
      shortDescription: "",
      mediaIds: media ? [media.id] : [],
      primaryMediaId: media ? media.id : null,
      galleryMediaIds: media ? [media.id] : [],
      price: 0,
      compareAtPrice: null,
      currency: "INR",
      stock: 0,
      status: "DRAFT",
      assignedEmployeeId: null,
      createdAt: KIDS_DRAFT_MIGRATED_AT,
      updatedAt: KIDS_DRAFT_MIGRATED_AT,
      createdBy: KIDS_DRAFT_AUTHOR,
      updatedBy: KIDS_DRAFT_AUTHOR,
      reviewedAt: null,
      publishedAt: null,
      reviewFlags: ["KIDS_MIGRATION_REVIEW"],
    };
  });
};

/**
 * Appends any missing Kids draft records. Idempotent: existing KID ids —
 * including ones a human already edited — are never touched.
 */
export const ensureKidsDraftRecords = (items) => {
  const register = Array.isArray(items) ? items : [];
  const present = new Set(register.map((record) => String(record?.id ?? "")));
  const missing = kidsDraftRecords().filter((draft) => !present.has(draft.id));
  return missing.length ? [...register, ...missing] : register;
};

/**
 * Storage-aware sync. A stored version marker guarantees the migration
 * applies at most once per browser, exactly like the kidswear remap sync.
 * Re-running is harmless — the pure migration is idempotent.
 */
export const syncProductDraftRecords = (items) => {
  const storage = typeof localStorage !== "undefined" ? localStorage : null;

  let appliedVersion = PRODUCT_DRAFT_SYNC_VERSION;
  if (storage) {
    try {
      appliedVersion = Number(storage.getItem(PRODUCT_DRAFT_SYNC_KEY) || 0);
    } catch {
      /* storage read failure — fall through and re-apply the pure migration */
    }
  }
  if (appliedVersion >= PRODUCT_DRAFT_SYNC_VERSION && storage) {
    return ensureKidsDraftRecords(items);
  }

  const next = ensureKidsDraftRecords(items);

  if (storage) {
    try {
      storage.setItem(PRODUCT_DRAFT_SYNC_KEY, String(PRODUCT_DRAFT_SYNC_VERSION));
    } catch {
      /* storage failure must never reset products */
    }
  }
  return next;
};

export default {
  KIDS_MEDIA_FILENAMES,
  KIDS_PRODUCT_IDS,
  kidsDraftRecords,
  ensureKidsDraftRecords,
  syncProductDraftRecords,
};

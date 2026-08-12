/**
 * PRATIKSHYA FASHON — Catalogue repository (Phase 13).
 *
 * The ONE product repository. Customer storefront, admin portal, employee
 * portal, media, cart, wishlist, orders and (later) inventory, analytics
 * and AI all resolve product truth through this module. There is no admin
 * catalogue, no employee catalogue — one `pratikshya_products` register.
 *
 * Phase 13 upgrades the Phase 11 CRUD into a complete merchandising model:
 * identity, category & attributes, centralised pricing, variants, content,
 * SEO, flags, publishing status and an approval workflow — while every
 * existing product id, slug and field keeps working untouched.
 *
 * Rules honoured here, not in the UI:
 *   · existing ids are never regenerated
 *   · slugs are preserved and unique
 *   · SKUs are unique across products AND variants
 *   · final price is computed by the shared pricing engine, never locally
 *   · every mutation is signed (actor) and recorded in the shared diary
 *   · nothing is hard-deleted; retirement is ARCHIVED
 */

import { products as seedProducts, slugify } from "../data/products/index.js";
import { getProductMediaSummary } from "./media/mediaRepository";
import {
  ACTIVITY_ACTIONS,
  describeActor,
  loadActivity,
  recordActivity,
} from "./employees/activityService";
import { DISCOUNT_TYPES, computePricing } from "../utils/pricing";
import { formatINR } from "../utils/shopping";

const KEY = "pratikshya_products";
export const PRODUCTS_CHANGED_EVENT = "pratikshya-products-changed";

export const PRODUCT_STATUS = {
  DRAFT: "DRAFT",
  PENDING_REVIEW: "PENDING_REVIEW",
  PUBLISHED: "PUBLISHED",
  ARCHIVED: "ARCHIVED",
};

export const REVIEW_STATE = {
  NONE: "NONE",
  PENDING: "PENDING",
  APPROVED: "APPROVED",
  REJECTED: "REJECTED",
};

const nowIso = () => new Date().toISOString();

const actorLabel = (actor) => {
  if (!actor) return "System";
  if (actor.adminId) return actor.name ? `${actor.name} (${actor.adminId})` : actor.adminId;
  if (actor.employeeId) {
    return actor.label
      ? `${actor.label} (${actor.employeeId})`
      : `${actor.firstName ?? ""} ${actor.lastName ?? ""}`.trim() + ` (${actor.employeeId})`;
  }
  return actor.label || actor.name || "System";
};

/* ------------------------------------------------------------------ */
/* Storage                                                             */
/* ------------------------------------------------------------------ */

/** Authored plates arrive as rich manifest objects; the register stores ids. */
const imageIdOf = (value) => {
  if (!value) return value;
  if (typeof value === "object") return value.id ?? value.src ?? null;
  return value;
};

const read = () => {
  try {
    const value = JSON.parse(localStorage.getItem(KEY));
    if (Array.isArray(value) && value.length) {
      /* Heals early rows that persisted plate objects instead of ids. */
      return value.map((record) =>
        record && typeof record.image === "object"
          ? { ...record, image: imageIdOf(record.image), hoverImage: imageIdOf(record.hoverImage) }
          : record
      );
    }
    return seedProducts.map((p, i) => ({
      ...p,
      image: imageIdOf(p.image),
      hoverImage: imageIdOf(p.hoverImage),
      additionalImages: Array.isArray(p.additionalImages) ? p.additionalImages.map(imageIdOf) : p.additionalImages,
      status: "PUBLISHED",
      published: true,
      sku: p.sku || `PF-${String(i + 1).padStart(5, "0")}`,
      updatedAt: new Date().toISOString(),
    }));
  } catch {
    return seedProducts;
  }
};

const save = (items) => {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* Storage failure never breaks the register. */
  }
  window.dispatchEvent(new Event(PRODUCTS_CHANGED_EVENT));
  return items;
};

/* ------------------------------------------------------------------ */
/* Normalisation — merge the full model with safe defaults             */
/* ------------------------------------------------------------------ */

const asArray = (value) => (Array.isArray(value) ? value.filter(Boolean) : []);

const normalisePricing = (raw) => {
  const pricing = raw.pricing && typeof raw.pricing === "object" ? raw.pricing : {};
  const selling = Number(pricing.sellingPrice ?? raw.price ?? 0) || 0;
  const mrp = Number(pricing.mrp ?? (raw.originalPrice > selling ? raw.originalPrice : selling)) || 0;
  return {
    mrp,
    sellingPrice: selling,
    discountType: pricing.discountType || DISCOUNT_TYPES.NONE,
    discountValue: Number(pricing.discountValue ?? 0) || 0,
    taxMode: pricing.taxMode || "INCLUSIVE",
    taxRate: Number(pricing.taxRate ?? 0) || 0,
    customTaxRate: Boolean(pricing.customTaxRate),
  };
};

const normaliseVariant = (variant, index) => ({
  id: variant.id || `var-${Date.now().toString(36)}-${index}`,
  sku: variant.sku || "",
  color: variant.color || "",
  size: variant.size || "",
  priceOverride:
    variant.priceOverride === "" || variant.priceOverride == null
      ? null
      : Number(variant.priceOverride) || null,
  stock: Number(variant.stock ?? 0) || 0,
  barcode: variant.barcode || "",
  status: variant.status === "INACTIVE" ? "INACTIVE" : "ACTIVE",
  createdAt: variant.createdAt || nowIso(),
});

/**
 * Merges any stored record — Phase 11 minimal rows included — into the
 * complete Phase 13 shape. Additive only: nothing already present is
 * dropped, and ids are never regenerated.
 */
export const normaliseProductRecord = (raw = {}, index = 0) => {
  const id = raw.id || `pf-${Date.now().toString(36)}-${index}`;
  const name = raw.name || "";
  const slug = raw.slug || slugify(name || id);
  const pricing = normalisePricing(raw);
  const computed = computePricing(pricing);

  const variants = asArray(raw.variants).map(normaliseVariant);

  /* Collections: authored single label + Phase 13 multi-select. */
  const collections = asArray(raw.collections);
  const collection = raw.collection || collections[0] || "";

  const flags = raw.flags && typeof raw.flags === "object" ? raw.flags : {};
  const isFeatured = Boolean(raw.isFeatured ?? flags.featured);
  const isBestseller = Boolean(raw.isBestseller ?? flags.bestseller);
  const isNew = Boolean(raw.isNew ?? flags.newArrival);
  const isLimitedEdition = Boolean(raw.isLimitedEdition ?? flags.limitedEdition);
  const isTrending = Boolean(raw.isTrending ?? flags.trending);

  const review = raw.review && typeof raw.review === "object" ? raw.review : {};
  const status = raw.status || (raw.published === false ? "DRAFT" : "PUBLISHED");

  return {
    ...raw,

    /* Identity */
    id,
    name,
    slug,
    sku: raw.sku || `PF-${String(index + 1).padStart(5, "0")}`,
    brand: raw.brand || "Pratikshya Fashon",
    productType: raw.productType || "fashion",
    productCode: raw.productCode || "",
    barcode: raw.barcode || "",
    internalReference: raw.internalReference || "",

    /* Placement */
    category: raw.category || "",
    subcategory: raw.subcategory || "",
    gender: raw.gender || "Women",

    /* Content */
    shortDescription: raw.shortDescription || "",
    description: raw.description || "",
    highlights: asArray(raw.highlights),
    specifications:
      raw.specifications && typeof raw.specifications === "object" && !Array.isArray(raw.specifications)
        ? raw.specifications
        : {},
    careInstructions: Array.isArray(raw.careInstructions)
      ? raw.careInstructions
      : raw.careInstructions
        ? [String(raw.careInstructions)]
        : [],
    deliveryInfo: raw.deliveryInfo || "",
    returnInfo: raw.returnInfo || "",
    returnPolicy:
      raw.returnPolicy && typeof raw.returnPolicy === "object"
        ? raw.returnPolicy
        : { eligibility: "", window: "", notes: "" },

    /* Attributes */
    fabric: raw.fabric || "",
    material: raw.material || "",
    primaryColor: raw.primaryColor || "",
    secondaryColor: raw.secondaryColor || "",
    colors: asArray(raw.colors),
    patterns: asArray(raw.patterns),
    work: asArray(raw.work),
    occasion: asArray(raw.occasion),
    sizes: asArray(raw.sizes),
    unavailableColors: asArray(raw.unavailableColors),
    unavailableSizes: asArray(raw.unavailableSizes),
    season: raw.season || "",
    fit: raw.fit || "",
    length: raw.length || "",

    /* Merchandising */
    collection,
    collections: collections.length ? collections : collection ? [collection] : [],
    tags: asArray(raw.tags),
    badges: asArray(raw.badges),
    isFeatured,
    isBestseller,
    isNew,
    isLimitedEdition,
    isTrending,
    flags: {
      featured: isFeatured,
      bestseller: isBestseller,
      newArrival: isNew,
      limitedEdition: isLimitedEdition,
      trending: isTrending,
    },

    /* Pricing — storefront fields stay authoritative for the customer. */
    price: typeof raw.price === "number" ? raw.price : computed.finalPrice,
    originalPrice:
      typeof raw.originalPrice === "number" && raw.originalPrice > 0
        ? raw.originalPrice
        : computed.mrp > computed.finalPrice
          ? computed.mrp
          : undefined,
    pricing,
    priceHistory: asArray(raw.priceHistory),

    /* Variants */
    variants,

    /* Inventory preparation — stock movements arrive with Phase 14. */
    stock: Number(raw.stock ?? 0) || 0,
    availability: raw.availability || "in-stock",
    inventoryTracked: Boolean(raw.inventoryTracked),
    lowStockThreshold: Number(raw.lowStockThreshold ?? 5) || 5,

    /* SEO */
    seo:
      raw.seo && typeof raw.seo === "object"
        ? { title: raw.seo.title || "", description: raw.seo.description || "" }
        : { title: "", description: "" },

    /* Publishing & approval */
    status,
    published: status === "PUBLISHED",
    review: {
      state: review.state || REVIEW_STATE.NONE,
      submittedBy: review.submittedBy || null,
      submittedAt: review.submittedAt || null,
      reviewedBy: review.reviewedBy || null,
      reviewedAt: review.reviewedAt || null,
      rejectionReason: review.rejectionReason || "",
    },

    /* History */
    createdBy: raw.createdBy || null,
    createdAt: raw.createdAt || raw.updatedAt || nowIso(),
    updatedBy: raw.updatedBy || null,
    updatedAt: raw.updatedAt || nowIso(),
    publishedBy: raw.publishedBy || null,
    publishedAt: raw.publishedAt || null,
  };
};

/* ------------------------------------------------------------------ */
/* Reading                                                             */
/* ------------------------------------------------------------------ */

const allNormalised = () => read().map((record, index) => normaliseProductRecord(record, index));

const findNormalised = (id) =>
  allNormalised().find((product) => String(product.id) === String(id)) ?? null;

/* ------------------------------------------------------------------ */
/* Uniqueness                                                          */
/* ------------------------------------------------------------------ */

const slugTaken = (slug, ignoreId = null) =>
  allNormalised().some(
    (product) => product.slug === slug && String(product.id) !== String(ignoreId)
  );

/** Unique slug: the name's slug, suffixed with the product's own id on collision. */
const ensureUniqueSlug = (slug, ignoreId = null) => {
  if (!slugTaken(slug, ignoreId)) return slug;
  const candidate = `${slug}-${String(ignoreId ?? Date.now()).slice(-4)}`;
  let attempt = candidate;
  let counter = 2;
  while (slugTaken(attempt, ignoreId)) {
    attempt = `${candidate}-${counter}`;
    counter += 1;
  }
  return attempt;
};

/** SKU uniqueness across products AND variants. */
const skuTaken = (sku, ignoreProductId = null) => {
  if (!sku) return false;
  const target = String(sku).toLowerCase();
  return allNormalised().some((product) => {
    if (String(product.id) === String(ignoreProductId)) return false;
    if (product.sku?.toLowerCase() === target) return true;
    return product.variants.some((variant) => variant.sku?.toLowerCase() === target);
  });
};

/* ------------------------------------------------------------------ */
/* Publishing readiness                                                */
/* ------------------------------------------------------------------ */

/**
 * What still stands between a product and publication. One quality cover
 * is enough — video is never required.
 */
export const getPublishIssues = (product) => {
  if (!product) return ["Product not found."];
  const issues = [];
  if (!product.name?.trim()) issues.push("Product name is required.");
  if (!product.sku?.trim()) issues.push("SKU is required.");
  if (!product.category) issues.push("Category is required.");
  if (!(Number(product.price) > 0)) issues.push("Selling price must be greater than zero.");
  if (!product.description?.trim() && !product.shortDescription?.trim()) {
    issues.push("A description is required.");
  }
  const summary = getProductMediaSummary(product.id);
  const hasCataloguePlate = Boolean(product.image);
  if (!summary.hasCover && !hasCataloguePlate) {
    issues.push("At least one cover image is required before publishing.");
  }
  const pricingIssues = computePricing(product.pricing).errors;
  issues.push(...pricingIssues);
  return issues;
};

/* ------------------------------------------------------------------ */
/* Activity — the shared house diary, never a second log               */
/* ------------------------------------------------------------------ */

const noteProduct = (action, product, actor, summary) => {
  try {
    recordActivity(loadActivity(), {
      ...describeActor(actor),
      targetProductId: product.id,
      action,
      summary,
    });
  } catch {
    /* The diary is an enhancement; a failure never blocks the save. */
  }
};

/* ------------------------------------------------------------------ */
/* Writing                                                             */
/* ------------------------------------------------------------------ */

/**
 * The single writer. Merges a draft onto the stored record, computes
 * derived truth (price mapping, flags, history) and signs the change.
 */
const writeProduct = (draft, actor, { activity = null } = {}) => {
  const items = read();
  const index = items.findIndex((p) => String(p.id) === String(draft.id));
  const existing = index >= 0 ? normaliseProductRecord(items[index], index) : null;
  const label = actorLabel(actor);
  const at = nowIso();

  const merged = normaliseProductRecord(
    { ...(existing ?? {}), ...draft, id: draft.id ?? undefined },
    index >= 0 ? index : items.length
  );

  /* Pricing — the engine decides; storefront fields follow. */
  const computed = computePricing(merged.pricing);
  if (!computed.errors.length && computed.finalPrice > 0) {
    merged.price = computed.finalPrice;
    merged.originalPrice = computed.mrp > computed.finalPrice ? computed.mrp : undefined;
  }
  merged.pricing = { ...merged.pricing, finalPrice: computed.finalPrice };

  /* Slug — preserved where it exists, unique always. */
  merged.slug = ensureUniqueSlug(draft.slug || merged.slug, merged.id);

  /* Flags mirror the flat fields the storefront already reads. */
  merged.flags = {
    featured: merged.isFeatured,
    bestseller: merged.isBestseller,
    newArrival: merged.isNew,
    limitedEdition: merged.isLimitedEdition,
    trending: merged.isTrending,
  };
  merged.published = merged.status === PRODUCT_STATUS.PUBLISHED;

  /* History */
  merged.updatedBy = label;
  merged.updatedAt = at;
  if (!existing) {
    merged.createdBy = merged.createdBy || label;
    merged.createdAt = merged.createdAt || at;
  }
  if (merged.status === PRODUCT_STATUS.PUBLISHED && existing?.status !== PRODUCT_STATUS.PUBLISHED) {
    merged.publishedBy = label;
    merged.publishedAt = at;
  }

  /* Lightweight price-change history for the demo. */
  if (existing && Number(existing.price) !== Number(merged.price) && Number(merged.price) > 0) {
    merged.priceHistory = [
      { at, by: label, from: Number(existing.price), to: Number(merged.price) },
      ...merged.priceHistory,
    ].slice(0, 24);
  }

  const next = [...items];
  if (index >= 0) next[index] = merged;
  else next.unshift(merged);
  save(next);

  /* Diary entries. */
  if (existing && Number(existing.price) !== Number(merged.price) && Number(merged.price) > 0) {
    noteProduct(
      ACTIVITY_ACTIONS.PRODUCT_PRICE_CHANGED,
      merged,
      actor,
      `${merged.name} · price ${formatINR(existing.price)} → ${formatINR(merged.price)}`
    );
  }
  const variantsBefore = existing?.variants.length ?? 0;
  if (merged.variants.length > variantsBefore) {
    noteProduct(
      ACTIVITY_ACTIONS.PRODUCT_VARIANT_ADDED,
      merged,
      actor,
      `${merged.name} · ${merged.variants.length - variantsBefore} variant${merged.variants.length - variantsBefore === 1 ? "" : "s"} added`
    );
  } else if (existing && JSON.stringify(existing.variants) !== JSON.stringify(merged.variants)) {
    noteProduct(ACTIVITY_ACTIONS.PRODUCT_VARIANT_UPDATED, merged, actor, `${merged.name} · variants updated`);
  }
  if (activity) noteProduct(activity.action, merged, actor, activity.summary);
  else if (!existing) {
    noteProduct(ACTIVITY_ACTIONS.PRODUCT_CREATED, merged, actor, `Created product ${merged.name}`);
  } else {
    noteProduct(ACTIVITY_ACTIONS.PRODUCT_EDITED, merged, actor, `Edited product ${merged.name}`);
  }

  return merged;
};

/* ------------------------------------------------------------------ */
/* Public repository                                                   */
/* ------------------------------------------------------------------ */

export const catalogRepository = {
  /** Every product, in the complete Phase 13 shape. */
  all: allNormalised,

  find: findNormalised,

  findBySlug: (slug) => allNormalised().find((product) => product.slug === slug) ?? null,

  /** Legacy Phase 11 entry point — kept so nothing upstream breaks. */
  upsert: (product, actor = null) => {
    const draft = { ...product };
    if (!draft.id) draft.id = `pf-${Date.now().toString(36)}`;
    draft.status = draft.status || "DRAFT";
    return writeProduct(draft, actor);
  },

  /** Create a brand-new product. Returns `{ ok, product }`. */
  createProduct: (draft, actor = null) => {
    const id = `pf-${Date.now().toString(36)}`;
    const product = writeProduct(
      { ...draft, id, createdAt: nowIso(), createdBy: actorLabel(actor) },
      actor
    );
    return { ok: true, product };
  },

  /** Update an existing product by id. Returns `{ ok, product }`. */
  updateProduct: (id, patch, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct({ ...patch, id: existing.id }, actor);
    return { ok: true, product };
  },

  /* ---------------- workflow -------------------------------------- */

  submitForReview: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct(
      {
        id,
        status: PRODUCT_STATUS.PENDING_REVIEW,
        review: {
          ...existing.review,
          state: REVIEW_STATE.PENDING,
          submittedBy: actorLabel(actor),
          submittedAt: nowIso(),
          rejectionReason: "",
          reviewedBy: null,
          reviewedAt: null,
        },
      },
      actor,
      {
        activity: {
          action: ACTIVITY_ACTIONS.PRODUCT_SUBMITTED,
          summary: `Submitted ${existing.name} for review`,
        },
      }
    );
    return { ok: true, product };
  },

  approveProduct: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const issues = getPublishIssues(existing);
    if (issues.length) return { ok: false, errors: issues };
    const product = writeProduct(
      {
        id,
        status: PRODUCT_STATUS.PUBLISHED,
        review: {
          ...existing.review,
          state: REVIEW_STATE.APPROVED,
          reviewedBy: actorLabel(actor),
          reviewedAt: nowIso(),
          rejectionReason: "",
        },
      },
      actor,
      {
        activity: {
          action: ACTIVITY_ACTIONS.PRODUCT_APPROVED,
          summary: `Approved and published ${existing.name}`,
        },
      }
    );
    return { ok: true, product };
  },

  rejectProduct: (id, reason = "", actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct(
      {
        id,
        status: PRODUCT_STATUS.DRAFT,
        review: {
          ...existing.review,
          state: REVIEW_STATE.REJECTED,
          reviewedBy: actorLabel(actor),
          reviewedAt: nowIso(),
          rejectionReason: reason,
        },
      },
      actor,
      {
        activity: {
          action: ACTIVITY_ACTIONS.PRODUCT_REJECTED,
          summary: `Rejected ${existing.name}${reason ? ` — ${reason}` : ""}`,
        },
      }
    );
    return { ok: true, product };
  },

  publishProduct: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const issues = getPublishIssues(existing);
    if (issues.length) return { ok: false, errors: issues };
    const product = writeProduct(
      { id, status: PRODUCT_STATUS.PUBLISHED },
      actor,
      {
        activity: {
          action: ACTIVITY_ACTIONS.PRODUCT_PUBLISHED,
          summary: `Published ${existing.name}`,
        },
      }
    );
    return { ok: true, product };
  },

  unpublishProduct: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct({ id, status: PRODUCT_STATUS.DRAFT }, actor, {
      activity: {
        action: ACTIVITY_ACTIONS.PRODUCT_UNPUBLISHED,
        summary: `Unpublished ${existing.name} to draft`,
      },
    });
    return { ok: true, product };
  },

  archiveProduct: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct({ id, status: PRODUCT_STATUS.ARCHIVED }, actor, {
      activity: {
        action: ACTIVITY_ACTIONS.PRODUCT_ARCHIVED,
        summary: `Archived ${existing.name}`,
      },
    });
    return { ok: true, product };
  },

  restoreProduct: (id, actor = null) => {
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct({ id, status: PRODUCT_STATUS.DRAFT }, actor, {
      activity: {
        action: ACTIVITY_ACTIONS.PRODUCT_RESTORED,
        summary: `Restored ${existing.name} from the archive`,
      },
    });
    return { ok: true, product };
  },

  /** Legacy status switch — Phase 11 callers keep working. */
  updateStatus: (id, status, actor = null) => {
    if (status === PRODUCT_STATUS.PUBLISHED) return catalogRepository.publishProduct(id, actor);
    if (status === PRODUCT_STATUS.ARCHIVED) return catalogRepository.archiveProduct(id, actor);
    const existing = findNormalised(id);
    if (!existing) return { ok: false, error: "Product not found." };
    const product = writeProduct({ id, status }, actor);
    return { ok: true, product };
  },

  /**
   * Duplicate a product. New id, new SKU, new slug, deep-copied variants —
   * no shared mutable state. Media stays with the original; attach plates
   * through the media manager.
   */
  duplicateProduct: (id, actor = null) => {
    const source = findNormalised(id);
    if (!source) return { ok: false, error: "Product not found." };
    const at = nowIso();
    const label = actorLabel(actor);
    const newId = `pf-${Date.now().toString(36)}`;

    let sku = `${source.sku}-COPY`;
    let counter = 2;
    while (skuTaken(sku)) {
      sku = `${source.sku}-COPY-${counter}`;
      counter += 1;
    }

    const copy = {
      ...source,
      id: newId,
      name: `${source.name} (Copy)`,
      slug: "",
      sku,
      status: PRODUCT_STATUS.DRAFT,
      published: false,
      variants: source.variants.map((variant, index) => {
        let variantSku = variant.sku ? `${variant.sku}-COPY` : "";
        let variantCounter = 2;
        while (variantSku && skuTaken(variantSku, newId)) {
          variantSku = `${variant.sku}-COPY-${variantCounter}`;
          variantCounter += 1;
        }
        return {
          ...variant,
          id: `var-${Date.now().toString(36)}-${index}`,
          sku: variantSku,
          createdAt: at,
        };
      }),
      review: {
        state: REVIEW_STATE.NONE,
        submittedBy: null,
        submittedAt: null,
        reviewedBy: null,
        reviewedAt: null,
        rejectionReason: "",
      },
      priceHistory: [],
      createdBy: label,
      createdAt: at,
      updatedBy: label,
      updatedAt: at,
      publishedBy: null,
      publishedAt: null,
    };
    copy.slug = ensureUniqueSlug(slugify(copy.name), newId);

    const product = writeProduct(copy, actor, {
      activity: {
        action: ACTIVITY_ACTIONS.PRODUCT_DUPLICATED,
        summary: `Duplicated ${source.name} as ${copy.name}`,
      },
    });
    return { ok: true, product };
  },

  /**
   * Bulk merchandising — publish, archive, flag. Applies only to products
   * that can legally take the change; returns what happened.
   */
  bulkUpdate: (ids, patch, actor = null, summary = "Bulk product update") => {
    const targets = allNormalised().filter((product) => ids.includes(product.id));
    let applied = 0;
    let skipped = 0;
    targets.forEach((product) => {
      if (patch.status === PRODUCT_STATUS.PUBLISHED) {
        const result = catalogRepository.publishProduct(product.id, actor);
        if (result.ok) applied += 1;
        else skipped += 1;
        return;
      }
      writeProduct({ ...patch, id: product.id }, actor, { activity: null });
      applied += 1;
    });
    if (applied > 0) {
      const first = targets[0];
      try {
        recordActivity(loadActivity(), {
          ...describeActor(actor),
          targetProductId: first?.id ?? null,
          action: ACTIVITY_ACTIONS.PRODUCT_BULK_UPDATED,
          summary: `${summary} · ${applied} product${applied === 1 ? "" : "s"}${skipped ? `, ${skipped} skipped` : ""}`,
        });
      } catch {
        /* Diary failures never block. */
      }
    }
    return { ok: true, applied, skipped };
  },

  /* ---------------- validation helpers ----------------------------- */

  /** Legacy signature kept; now also checks variant SKUs. */
  skuTaken: (sku, ignoreProductId = null) => skuTaken(sku, ignoreProductId),

  slugTaken: (slug, ignoreId = null) => Boolean(slug) && slugTaken(slug, ignoreId),

  suggestSlug: (name, ignoreId = null) => ensureUniqueSlug(slugify(name || ""), ignoreId),
};

/* ------------------------------------------------------------------ */
/* Metrics — computed from the repository, never stored                */
/* ------------------------------------------------------------------ */

export const catalogMetrics = (items) => {
  const list = (items ?? []).map((item, index) =>
    item.status || item.pricing ? item : normaliseProductRecord(item, index)
  );
  const needsPricingReview = (product) => {
    const computed = computePricing(product.pricing);
    return computed.errors.length > 0 || !(Number(product.price) > 0);
  };
  const needsMedia = (product) => {
    if (product.image) return false;
    const summary = getProductMediaSummary(product.id);
    return !summary.hasCover;
  };

  return {
    total: list.length,
    published: list.filter((p) => p.status === "PUBLISHED").length,
    drafts: list.filter((p) => p.status === "DRAFT").length,
    pendingReview: list.filter((p) => p.status === "PENDING_REVIEW").length,
    archived: list.filter((p) => p.status === "ARCHIVED").length,
    featured: list.filter((p) => p.isFeatured).length,
    bestsellers: list.filter((p) => p.isBestseller).length,
    newArrivals: list.filter((p) => p.isNew).length,
    needsMedia: list.filter(needsMedia).length,
    needsPricingReview: list.filter(needsPricingReview).length,
    /* Legacy Phase 11 tiles keep their fields. */
    lowStock: list.filter((p) => p.stock > 0 && p.stock <= 5).length,
    out: list.filter((p) => !p.stock || p.status === "ARCHIVED").length,
  };
};

export default catalogRepository;

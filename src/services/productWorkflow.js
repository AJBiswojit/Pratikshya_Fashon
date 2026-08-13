/**
 * PRATIKSHYA FASHON — Media-to-product workflow (Phase 22).
 *
 * The deterministic MEDIA → PRODUCT DRAFT → REVIEW → PUBLISH pipeline.
 *
 * This module extends the existing architecture — it never replaces it:
 *   · product truth  → catalogRepository (one register)
 *   · media truth    → mediaRepository + mediaResolver (one register)
 *   · media sets     → productMediaSet (getProductMediaSet)
 *   · groups         → mediaNaming (deterministic filename parsing)
 *   · authorization  → employees/authorization (one permission model)
 *   · logging        → employees/activityService (one diary)
 *
 * The rules this layer enforces:
 *   · a media asset belongs to ONE product; a conflicting assignment is
 *     reported as MEDIA_ALREADY_ASSIGNED and never silently reassigned
 *   · Product IDs are permanent, deterministic and never derived from names
 *   · drafts stay invisible to customers until PUBLISHED
 *   · employees edit only their assigned products, only the allowed fields
 *   · visual similarity is a review signal, never automatic identity
 */

import catalogRepository, { PRODUCT_STATUS, getPublishIssues } from "./catalogRepository";
import mediaRepository from "./media/mediaRepository";
import { getProductMediaSet, resolveProductMediaClaims } from "./media/productMediaSet";
import { parseMediaFilename } from "./media/mediaNaming";
import { buildMediaGroups } from "./media/mediaGroups";
import {
  GROUP_DECISIONS,
  getAllGroups,
  getGroupById,
  createGroup,
  setGroupDecision,
  setGroupProduct,
  setVariantReviewRequired,
} from "./media/productMediaGroups";
import { MEDIA_SCOPES, MEDIA_STATUS, MAPPING_STATUS, DUPLICATE_STATUS } from "../config/mediaTypes";
import { DEFAULT_PRODUCT_ID_PREFIX, PRODUCT_ID_PREFIXES } from "../config/productCatalogConfig";
import { PERMISSIONS } from "../config/employeePermissions";
import { ROLES } from "../config/employeeRoles";
import { canEmployeeLogin } from "../config/employeeStatus";
import { hasPermission } from "./employees/authorization";
import { getEmployee, getEmployees, loadEmployees } from "./employees/employeeService";
import {
  ACTIVITY_ACTIONS,
  describeActor,
  loadActivity,
  recordActivity,
} from "./employees/activityService";
import { employeeFullName } from "../utils/employee";

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

export const productIdPrefixFor = (categoryId) =>
  PRODUCT_ID_PREFIXES[categoryId] ?? DEFAULT_PRODUCT_ID_PREFIX;

export const genderForCategory = (categoryId) => {
  if (categoryId === "kidswear") return "Kids";
  if (categoryId === "menswear") return "Men";
  return "Women";
};

export const mediaFileName = (media) =>
  String(
    media?.currentFilename ||
      media?.fileName ||
      (media?.url || media?.thumbnail || "").split("/").pop() ||
      media?.id ||
      ""
  );

const numberFromGroupKey = (groupKey) => {
  const match = String(groupKey || "").match(/(\d+)$/);
  return match ? Number(match[1]) : null;
};

const note = (action, summary, actor, productId = null) => {
  try {
    recordActivity(loadActivity(), {
      ...describeActor(actor),
      targetProductId: productId,
      action,
      summary,
    });
  } catch {
    /* The diary is an enhancement; a failure never blocks the workflow. */
  }
};

const employeeName = (employeeId) => {
  if (!employeeId) return null;
  try {
    const employee = getEmployee(loadEmployees(), employeeId);
    return employee ? employeeFullName(employee) : null;
  } catch {
    return null;
  }
};

/* ------------------------------------------------------------------ */
/* Stable Product IDs                                                  */
/* ------------------------------------------------------------------ */

/**
 * The next permanent Product ID for a category: KID-001, MEN-001, …
 * Deterministic — scans the register, never random, never regenerated,
 * never derived from a product name.
 */
export const nextStableProductId = (categoryId, preferredNumber = null) => {
  const prefix = productIdPrefixFor(categoryId);
  const taken = new Set(catalogRepository.all().map((product) => String(product.id)));

  if (preferredNumber != null && Number.isFinite(Number(preferredNumber))) {
    const candidate = `${prefix}-${String(preferredNumber).padStart(3, "0")}`;
    if (!taken.has(candidate)) return candidate;
  }

  let number = 1;
  while (taken.has(`${prefix}-${String(number).padStart(3, "0")}`)) number += 1;
  return `${prefix}-${String(number).padStart(3, "0")}`;
};

/** The preferred Product ID for a set of media, derived from its group. */
export const preferredProductIdForMedia = (mediaItems = [], categoryId = null) => {
  const numbers = [...new Set(mediaItems.map((media) => numberFromGroupKey(media?.groupKey)).filter((n) => n != null))];
  const preferredNumber = numbers.length === 1 ? numbers[0] : null;
  const prefixCategory = categoryId || mediaItems[0]?.categoryId || null;
  return nextStableProductId(prefixCategory, preferredNumber);
};

/* ------------------------------------------------------------------ */
/* Ownership validation                                                */
/* ------------------------------------------------------------------ */

/**
 * Deterministic ownership check. Returns:
 *   { ok: true }                                  — media unassigned / same owner
 *   { ok: false, error: "MEDIA_ALREADY_ASSIGNED", ownerProductId, ownerProductName }
 */
export const validateMediaAssignment = (mediaId, targetProductId) => {
  const media = mediaRepository.getById(mediaId);
  if (!media) return { ok: false, error: "Media not found." };
  if (!media.productId) return { ok: true, media };
  if (String(media.productId) === String(targetProductId)) return { ok: true, media, alreadyOwned: true };
  const owner = catalogRepository.find(media.productId);
  return {
    ok: false,
    error: "MEDIA_ALREADY_ASSIGNED",
    media,
    ownerProductId: media.productId,
    ownerProductName: owner?.name ?? null,
    ownerProductStatus: owner?.status ?? null,
  };
};

/**
 * Moves media ownership to another product — the ONE door for reassignment.
 * Nothing is silent: a conflicting assignment requires `confirm`, the
 * previous owner's stale authored references are removed, and the diary
 * records the transfer.
 */
export const transferMediaOwnership = (mediaId, targetProductId, actor = null, { confirm = false } = {}) => {
  const check = validateMediaAssignment(mediaId, targetProductId);
  if (!check.ok && !confirm) return { ok: false, ...check };

  const media = mediaRepository.getById(mediaId);
  if (!media) return { ok: false, error: "Media not found." };

  const previousOwnerId = media.productId ? String(media.productId) : null;
  const moving = String(previousOwnerId ?? "") !== String(targetProductId);

  const moved = mediaRepository.assignToProduct(mediaId, targetProductId, null, { confirmReassign: true });
  if (!moved) return { ok: false, error: "Could not reassign media." };

  let previousOwnerStripped = false;
  if (moving && previousOwnerId) {
    const owner = catalogRepository.find(previousOwnerId);
    if (owner) {
      const identityKeys = new Set(
        [moved.id, moved.fileName, moved.currentFilename, moved.originalFilename, moved.url]
          .filter(Boolean)
          .map((value) => String(value))
      );
      const matches = (value) => {
        if (!value) return false;
        const id = typeof value === "string" ? value : value?.id ?? value?.src ?? "";
        return identityKeys.has(String(id));
      };
      const patch = {};
      if (owner.image != null && matches(owner.image)) patch.image = undefined;
      if (owner.hoverImage != null && matches(owner.hoverImage)) patch.hoverImage = undefined;
      if (Array.isArray(owner.additionalImages)) {
        patch.additionalImages = owner.additionalImages.filter((entry) => !matches(entry));
      }
      patch.reviewFlags = [...new Set([...(owner.reviewFlags ?? []), "MEDIA_OWNERSHIP_MOVED"])];
      catalogRepository.updateProduct(previousOwnerId, patch, actor);
      previousOwnerStripped = true;
    }
  }

  note(
    ACTIVITY_ACTIONS.PRODUCT_MEDIA_TRANSFERRED,
    `Transferred ${mediaFileName(moved)} ${previousOwnerId ? `from ${previousOwnerId}` : "from the library"} to ${targetProductId}`,
    actor,
    targetProductId
  );

  return { ok: true, media: moved, previousOwnerId, previousOwnerStripped };
};

/** Detaches media from its product and returns it to the unassigned library. */
export const unassignProductMedia = (mediaId, actor = null) => {
  const media = mediaRepository.getById(mediaId);
  if (!media) return { ok: false, error: "Media not found." };
  const previousOwnerId = media.productId ? String(media.productId) : null;

  if (previousOwnerId) {
    const owner = catalogRepository.find(previousOwnerId);
    if (owner) {
      const identityKeys = new Set(
        [media.id, media.fileName, media.currentFilename, media.originalFilename, media.url]
          .filter(Boolean)
          .map((value) => String(value))
      );
      const matches = (value) => {
        if (!value) return false;
        const id = typeof value === "string" ? value : value?.id ?? value?.src ?? "";
        return identityKeys.has(String(id));
      };
      const patch = {};
      if (owner.image != null && matches(owner.image)) patch.image = undefined;
      if (owner.hoverImage != null && matches(owner.hoverImage)) patch.hoverImage = undefined;
      if (Array.isArray(owner.additionalImages)) {
        patch.additionalImages = owner.additionalImages.filter((entry) => !matches(entry));
      }
      patch.reviewFlags = [...new Set([...(owner.reviewFlags ?? []), "MEDIA_UNASSIGNED"])];
      catalogRepository.updateProduct(previousOwnerId, patch, actor);
    }
  }

  const detached = mediaRepository.assignToProduct(mediaId, null);
  note(
    ACTIVITY_ACTIONS.PRODUCT_MEDIA_UNASSIGNED,
    `Unassigned ${mediaFileName(detached)}${previousOwnerId ? ` from ${previousOwnerId}` : ""}`,
    actor,
    previousOwnerId
  );
  return { ok: true, media: detached, previousOwnerId };
};

/* ------------------------------------------------------------------ */
/* Product drafts                                                      */
/* ------------------------------------------------------------------ */

/**
 * CREATE PRODUCT FROM MEDIA — the controlled action.
 *
 * 1. resolves a stable Product ID from the media group
 * 2. creates a DRAFT product (never auto-published)
 * 3. attaches the media as claims (primary + gallery)
 * 4. never guesses a name, price or classification
 * 5. reports any contested ownership instead of reassigning anything
 */
export const createProductDraftFromMedia = ({
  mediaIds,
  categoryId = null,
  subcategory = "",
  employeeId = null,
  actor = null,
} = {}) => {
  const ids = (Array.isArray(mediaIds) ? mediaIds : [mediaIds]).filter(Boolean);
  const mediaItems = ids.map((id) => mediaRepository.getById(id)).filter(Boolean);
  if (!mediaItems.length) return { ok: false, error: "Select at least one media asset." };

  const category = categoryId || mediaItems[0].categoryId || "";
  const id = preferredProductIdForMedia(mediaItems, category);
  const conflicts = [];
  mediaItems.forEach((media) => {
    const check = validateMediaAssignment(media.id, id);
    if (!check.ok) {
      conflicts.push({
        mediaId: media.id,
        file: mediaFileName(media),
        ownerProductId: check.ownerProductId,
        ownerProductName: check.ownerProductName,
      });
    }
  });

  const result = catalogRepository.createDraftProduct(
    {
      id,
      name: "",
      category,
      subcategory,
      gender: genderForCategory(category),
      description: "",
      shortDescription: "",
      mediaIds: mediaItems.map((media) => media.id),
      primaryMediaId: mediaItems[0].id,
      galleryMediaIds: mediaItems.map((media) => media.id),
      price: 0,
      compareAtPrice: null,
      currency: "INR",
      stock: 0,
      status: PRODUCT_STATUS.DRAFT,
      assignedEmployeeId: employeeId || null,
      reviewFlags: conflicts.length ? ["MEDIA_OWNERSHIP_REVIEW"] : [],
    },
    actor
  );

  return { ok: true, product: result.product, conflicts };
};

/** Assign a product draft to an authorized employee. */
export const assignProductToEmployee = (productId, employeeId, actor = null) => {
  const product = catalogRepository.find(productId);
  if (!product) return { ok: false, error: "Product not found." };
  if (employeeId) {
    const employee = getEmployee(loadEmployees(), employeeId);
    if (!employee) return { ok: false, error: "Employee not found." };
    if (!canEmployeeLogin(employee.status)) {
      return { ok: false, error: "That employee cannot sign in right now." };
    }
  }
  const result = catalogRepository.assignToEmployee(productId, employeeId || null, actor);
  return { ok: true, product: result.product };
};

/** Submit a draft for review. Publishing stays with the approver. */
export const submitProductForReview = (productId, actor = null) => {
  const product = catalogRepository.find(productId);
  if (!product) return { ok: false, error: "Product not found." };
  if (product.status === PRODUCT_STATUS.PUBLISHED) {
    return { ok: false, error: "This product is already published." };
  }
  if (product.status === PRODUCT_STATUS.ARCHIVED) {
    return { ok: false, error: "Archived products cannot be submitted." };
  }
  return catalogRepository.submitForReview(productId, actor);
};

/** Approve + publish, honouring every validation rule. */
export const approveProduct = (productId, actor = null) => {
  const product = catalogRepository.find(productId);
  if (!product) return { ok: false, error: "Product not found." };
  return catalogRepository.approveProduct(productId, actor);
};

export const publishProduct = (productId, actor = null) => {
  const product = catalogRepository.find(productId);
  if (!product) return { ok: false, error: "Product not found." };
  const issues = getPublishIssues(product);
  if (issues.length) return { ok: false, errors: issues };
  return catalogRepository.publishProduct(productId, actor);
};

export const archiveProduct = (productId, actor = null) =>
  catalogRepository.archiveProduct(productId, actor);

/** Admin-only Product ID change, with the media register kept in sync. */
export const changeProductId = (productId, newProductId, actor = null) => {
  const result = catalogRepository.changeProductId(productId, newProductId, actor);
  if (!result.ok) return result;
  /* Keep the media register's ownership references pointing at the truth. */
  mediaRepository
    .getAll()
    .filter((media) => String(media.productId) === String(productId))
    .forEach((media) => {
      mediaRepository.assignToProduct(media.id, result.product.id, null, { confirmReassign: true });
    });
  note(
    ACTIVITY_ACTIONS.PRODUCT_RENAMED_ID,
    `Changed Product ID ${productId} → ${result.product.id}`,
    actor,
    result.product.id
  );
  return result;
};

/* ------------------------------------------------------------------ */
/* Employee authorization for the workflow                             */
/* ------------------------------------------------------------------ */

/** Fields an assigned employee may edit — never identity or ownership. */
export const EMPLOYEE_EDITABLE_FIELDS = [
  "name",
  "price",
  "compareAtPrice",
  "description",
  "shortDescription",
  "category",
  "subcategory",
  "gender",
  "fabric",
  "material",
  "primaryColor",
  "secondaryColor",
  "colors",
  "patterns",
  "work",
  "occasion",
  "sizes",
  "season",
  "fit",
  "length",
  "highlights",
  "careInstructions",
  "collectionIds",
  "collections",
  "tags",
];

export const pickEmployeeEditableFields = (patch = {}) =>
  Object.fromEntries(
    Object.entries(patch).filter(([key]) => EMPLOYEE_EDITABLE_FIELDS.includes(key))
  );

/**
 * May this employee edit this product?
 * The existing authorization model decides: SUPER_ADMIN always; everyone
 * else needs products.manage AND the assignment of the product.
 */
export const employeeCanEditProduct = (employee, product) => {
  if (!employee || !product) return false;
  if (!canEmployeeLogin(employee.status)) return false;
  if (employee.role === ROLES.SUPER_ADMIN) return true;
  if (!hasPermission(employee, PERMISSIONS.PRODUCTS_MANAGE)) return false;
  return Boolean(product.assignedEmployeeId) && product.assignedEmployeeId === employee.employeeId;
};

/** The products an employee is authorized to work on. */
export const employeeAssignedProducts = (employeeId) => {
  if (!employeeId) return [];
  return catalogRepository
    .all()
    .filter((product) => product.assignedEmployeeId === employeeId)
    .filter((product) => product.status !== PRODUCT_STATUS.ARCHIVED);
};

/** Save an employee's draft edits — allowed fields only, signed. */
export const saveEmployeeDraft = (productId, patch, employee = null, actor = null) => {
  const product = catalogRepository.find(productId);
  if (!product) return { ok: false, error: "Product not found." };
  if (!employeeCanEditProduct(employee, product)) {
    return { ok: false, error: "You are not authorized to edit this product." };
  }
  const clean = pickEmployeeEditableFields(patch);
  const pricingPatch = {};
  if (clean.price != null) {
    const selling = Math.max(0, Number(clean.price) || 0);
    const mrp = Math.max(selling, Number(clean.compareAtPrice) || 0);
    pricingPatch.pricing = { ...(product.pricing ?? {}), sellingPrice: selling, mrp };
  }
  const result = catalogRepository.updateDraft(productId, { ...clean, ...pricingPatch }, actor);
  return { ok: true, product: result.product };
};

/* ------------------------------------------------------------------ */
/* Review workspace views                                              */
/* ------------------------------------------------------------------ */

/** Everything the admin/employee review surfaces need for one product. */
export const getProductWorkflowView = (product) => {
  if (!product) return null;
  const mediaSet = getProductMediaSet(product);
  const { claims, conflicts } = resolveProductMediaClaims(product, product.id);
  return {
    product,
    mediaSet,
    conflicts: mediaSet.ownershipConflicts ?? conflicts,
    issues: getPublishIssues(product),
  };
};

/**
 * The MEDIA INBOX — every media asset that is UNASSIGNED, DRAFT, REVIEW,
 * NEEDS_REVIEW, or claimed by / owned by a non-published product.
 * Never mutates; reads the one media register.
 */
export const getMediaInbox = () => {
  const products = catalogRepository.all();
  const productById = new Map(products.map((product) => [String(product.id), product]));

  const claimsByMediaId = new Map();
  products.forEach((product) => {
    if (product.status === PRODUCT_STATUS.ARCHIVED) return;
    (product.mediaIds ?? []).forEach((mediaId) => {
      if (!claimsByMediaId.has(String(mediaId))) claimsByMediaId.set(String(mediaId), []);
      claimsByMediaId.get(String(mediaId)).push(product);
    });
  });

  const isOpenOwner = (media) => {
    if (!media.productId) return false;
    const owner = productById.get(String(media.productId));
    if (!owner) return true; // orphaned ownership — must surface
    return owner.status === PRODUCT_STATUS.DRAFT || owner.status === PRODUCT_STATUS.PENDING_REVIEW;
  };

  const rows = mediaRepository
    .getAll()
    .filter(
      (media) =>
        media.scope === MEDIA_SCOPES.UNASSIGNED ||
        media.status === MEDIA_STATUS.DRAFT ||
        media.status === MEDIA_STATUS.PENDING_REVIEW ||
        media.mappingStatus === MAPPING_STATUS.NEEDS_REVIEW ||
        media.mappingStatus === MAPPING_STATUS.UNMAPPED ||
        media.duplicateStatus === DUPLICATE_STATUS.DUPLICATE ||
        media.duplicateStatus === DUPLICATE_STATUS.POSSIBLE_DUPLICATE ||
        claimsByMediaId.has(String(media.id)) ||
        isOpenOwner(media)
    )
    .map((media) => {
      const owner = media.productId ? productById.get(String(media.productId)) ?? null : null;
      const claimedBy = (claimsByMediaId.get(String(media.id)) ?? []).filter(
        (product) => String(product.id) !== String(media.productId ?? "")
      );
      const claimedDrafts = claimedBy.filter(
        (product) =>
          product.status === PRODUCT_STATUS.DRAFT || product.status === PRODUCT_STATUS.PENDING_REVIEW
      );
      return {
        media,
        groupKey: media.groupKey,
        view: media.view,
        isStandalone: media.isStandalone !== false,
        ownerProduct: owner ?? null,
        claimedByDrafts: claimedDrafts,
        categoryId: media.categoryId ?? owner?.category ?? null,
        assignedEmployeeId: owner?.assignedEmployeeId ?? claimedDrafts[0]?.assignedEmployeeId ?? null,
        assignedEmployeeName: employeeName(
          owner?.assignedEmployeeId ?? claimedDrafts[0]?.assignedEmployeeId ?? null
        ),
        tags: media.status === MEDIA_STATUS.DRAFT
          ? ["DRAFT"]
          : media.status === MEDIA_STATUS.PENDING_REVIEW
            ? ["REVIEW"]
            : media.scope === MEDIA_SCOPES.UNASSIGNED
              ? ["UNASSIGNED"]
              : media.mappingStatus === MAPPING_STATUS.NEEDS_REVIEW ||
                  media.mappingStatus === MAPPING_STATUS.UNMAPPED
                ? ["NEEDS_REVIEW"]
                : owner && (owner.status === PRODUCT_STATUS.DRAFT || owner.status === PRODUCT_STATUS.PENDING_REVIEW)
                  ? ["REVIEW"]
                  : claimedDrafts.length
                    ? ["CLAIMED_BY_DRAFT"]
                    : ["OPEN"],
      };
    })
    .sort((a, b) => {
      const rank = (row) =>
        row.tags.includes("DRAFT") ? 0 : row.tags.includes("REVIEW") ? 1 : row.tags.includes("UNASSIGNED") ? 2 : row.tags.includes("NEEDS_REVIEW") ? 3 : 4;
      return rank(a) - rank(b) || String(mediaFileName(a.media)).localeCompare(String(mediaFileName(b.media)));
    });

  return rows;
};

/* ------------------------------------------------------------------ */
/* Group review                                                        */
/* ------------------------------------------------------------------ */

/**
 * Candidate groups for the group-review desk.
 *
 * Deterministic signals only:
 *   · filename multi-view groups (the existing naming/grouping system)
 *   · ingestion flags (NEEDS_REVIEW / POSSIBLE_DUPLICATE)
 *   · the human decision register
 *
 * Visual similarity alone never proves identity — every candidate asks a
 * human: SAME PRODUCT or SEPARATE PRODUCTS.
 */
export const getPotentialProductGroups = () => {
  const products = catalogRepository.all();
  const productById = new Map(products.map((product) => [String(product.id), product]));
  const allMedia = mediaRepository.getAll();

  const toRow = (media) => ({
    mediaId: media.id,
    file: mediaFileName(media),
    src: media.url || media.thumbnail || media.optimizedPath || null,
    groupKey: media.groupKey,
    view: media.view,
    ownerProductId: media.productId ?? null,
    ownerProductName: media.productId ? productById.get(String(media.productId))?.name ?? null : null,
  });

  const flaggedStatus = (media) =>
    media.mappingStatus === MAPPING_STATUS.NEEDS_REVIEW ||
    media.mappingStatus === MAPPING_STATUS.UNMAPPED ||
    media.duplicateStatus === DUPLICATE_STATUS.POSSIBLE_DUPLICATE ||
    media.duplicateStatus === DUPLICATE_STATUS.DUPLICATE;

  /* 1. Deterministic filename groups. Multi-view groups whose files are
     clean follow the naming convention automatically (confirmed). A group
     that contains ingestion-flagged files still needs a human decision. */
  const productMedia = allMedia.filter(
    (media) => media.scope === MEDIA_SCOPES.PRODUCT || media.scope === MEDIA_SCOPES.UNASSIGNED
  );
  const filenameGroups = buildMediaGroups(
    productMedia.map((media) => ({ ...media, fileName: mediaFileName(media) }))
  ).filter((group) => group.files.length > 1);

  const filenameGroupRows = filenameGroups.map((group) => {
    const rows = group.files.map((file) => toRow(productMedia.find((media) => media.id === file.id) ?? file));
    const flagged = group.files.some((file) => {
      const record = productMedia.find((media) => media.id === file.id);
      return record ? flaggedStatus(record) : false;
    });
    return {
      id: `filename-${group.groupKey}`,
      kind: "FILENAME_GROUP",
      reason: flagged
        ? `The naming convention groups these ${group.files.length} views as one product, and ingestion flagged ${
            group.files.filter((file) => {
              const record = productMedia.find((media) => media.id === file.id);
              return record ? flaggedStatus(record) : false;
            }).length
          } asset(s) for review. Confirm: one product, or separate products?`
        : `One product, ${group.files.length} views (${[...new Set(group.files.map((file) => file.view).filter(Boolean))].join(", ")})`,
      media: rows,
      existingProductId: group.productId ?? null,
      confirmed: !flagged,
      decision: flagged ? null : GROUP_DECISIONS.SAME_PRODUCT,
      variantReviewRequired: false,
    };
  });

  /* 2. Duplicate signals — a flagged asset plus the record it points at.
     Visual similarity is only a suggestion: the pair is shown, a human
     decides whether these are the same product. */
  const duplicatePairs = [];
  const paired = new Set();
  allMedia.forEach((media) => {
    if (paired.has(media.id)) return;
    if (!media.duplicateOf) return;
    const target = allMedia.find((item) => item.id === media.duplicateOf);
    if (!target) return;
    paired.add(media.id);
    paired.add(target.id);
    duplicatePairs.push({
      id: `duplicate-${media.id}`,
      kind: "REVIEW_FLAG",
      reason:
        media.duplicateStatus === DUPLICATE_STATUS.DUPLICATE
          ? "Exact duplicate detected. Confirm whether both files belong to one product."
          : "Possible duplicate detected. These may be photographs of the same product — a human decides.",
      media: [media, target].map(toRow),
      existingProductId: media.productId ?? null,
      confirmed: false,
      decision: null,
      variantReviewRequired: false,
    });
  });

  /* 3. Stored human decisions still pending. */
  const stored = getAllGroups()
    .filter((group) => group.status !== "ARCHIVED")
    .map((group) => ({
      id: `stored-${group.id}`,
      kind: "MANUAL",
      reason: group.reason || "Group created by hand in the review desk.",
      media: group.mediaIds
        .map((mediaId) => mediaRepository.getById(mediaId))
        .filter(Boolean)
        .map(toRow),
      existingProductId: group.productId ?? null,
      confirmed: group.decision === GROUP_DECISIONS.SAME_PRODUCT,
      decision: group.decision,
      variantReviewRequired: group.variantReviewRequired,
    }))
    .filter((group) => group.media.length > 0);

  return [...stored, ...duplicatePairs, ...filenameGroupRows];
};

/**
 * The human decision on a group.
 *   SAME_PRODUCT      → one Product ID for all the group's media
 *   SEPARATE_PRODUCTS → each asset keeps its own identity
 *   REVIEW_LATER      → stays in the queue
 */
export const decideProductGroup = ({
  groupId,
  mediaIds,
  decision,
  existingProductId = null,
  actor = null,
} = {}) => {
  if (![GROUP_DECISIONS.SAME_PRODUCT, GROUP_DECISIONS.SEPARATE_PRODUCTS, GROUP_DECISIONS.REVIEW_LATER].includes(decision)) {
    return { ok: false, error: "Unknown group decision." };
  }

  const ids = (Array.isArray(mediaIds) ? mediaIds : []).filter(Boolean);
  const mediaItems = ids.map((id) => mediaRepository.getById(id)).filter(Boolean);
  if (!mediaItems.length) return { ok: false, error: "The group has no media assets." };

  let product = null;
  let conflictCount = 0;

  if (decision === GROUP_DECISIONS.SAME_PRODUCT) {
    if (existingProductId) {
      product = catalogRepository.find(existingProductId);
      if (!product) return { ok: false, error: "Existing product not found." };
      mediaItems.forEach((media) => {
        const moved = transferMediaOwnership(media.id, existingProductId, actor, { confirm: true });
        if (!moved.ok) conflictCount += 1;
      });
    } else {
      const created = createProductDraftFromMedia({ mediaIds: ids, actor });
      if (!created.ok) return created;
      product = created.product;
      conflictCount = created.conflicts.length;
    }
  }

  /* Record the decision in the group register. */
  const stored = getGroupById(groupId);
  const entry =
    stored ??
    createGroup(
      {
        id: groupId,
        mediaIds: ids,
        reason: "Decided in the product review desk.",
        source: "MANUAL",
      },
      typeof actor === "string" ? actor : actor?.label ?? actor?.name ?? null
    );
  setGroupDecision(entry.id, decision, typeof actor === "string" ? actor : actor?.label ?? actor?.name ?? null);
  if (product) setGroupProduct(entry.id, product.id);

  note(
    ACTIVITY_ACTIONS.PRODUCT_GROUP_DECIDED,
    `Group ${entry.id} · ${decision}${product ? ` · ${product.id}` : ""}`,
    actor,
    product?.id ?? null
  );

  return { ok: true, decision, product, conflicts: conflictCount };
};

/** Variant flag — when media may be one design in several colourways. */
export const markVariantReviewRequired = (groupId, required = true, actor = null) =>
  setVariantReviewRequired(
    groupId,
    required,
    typeof actor === "string" ? actor : actor?.label ?? actor?.name ?? null
  );

/* ------------------------------------------------------------------ */
/* Workflow metrics — the single snapshot for audits and the report    */
/* ------------------------------------------------------------------ */

export const getWorkflowMetrics = () => {
  const products = catalogRepository.all();
  const media = mediaRepository.getAll();
  const productIds = new Set(products.map((product) => String(product.id)));

  const byStatus = (status) => products.filter((product) => product.status === status).length;
  const published = byStatus(PRODUCT_STATUS.PUBLISHED);
  const draft = byStatus(PRODUCT_STATUS.DRAFT);
  const review = byStatus(PRODUCT_STATUS.PENDING_REVIEW);
  const archived = byStatus(PRODUCT_STATUS.ARCHIVED);

  const assignedMedia = media.filter((item) => item.scope === MEDIA_SCOPES.PRODUCT);
  const unassignedMedia = media.filter((item) => item.scope === MEDIA_SCOPES.UNASSIGNED);

  /* Ownership health — one owner per file, owners that actually exist.
     The Phase 12 seed register (house plates and sample footage) is a
     legacy category: the same plate intentionally decorates many legacy
     products. Duplicate-ownership is measured over the ingested product
     photography register only, where one file must never be owned by two
     products. */
  const ownershipPool = media.filter((item) => item.ingested || item.source === "Ingested library");
  const byFile = new Map();
  ownershipPool.forEach((item) => {
    const file = mediaFileName(item).toLowerCase();
    if (!file) return;
    if (!byFile.has(file)) byFile.set(file, []);
    byFile.get(file).push(item);
  });
  const duplicateOwnership = [...byFile.values()].filter(
    (records) => new Set(records.map((record) => String(record.productId ?? ""))).size > 1
  );
  const orphaned = media.filter(
    (item) => item.productId && !productIds.has(String(item.productId))
  );

  const groups = buildMediaGroups(
    media
      .filter((item) => item.scope === MEDIA_SCOPES.PRODUCT || item.scope === MEDIA_SCOPES.UNASSIGNED)
      .map((item) => ({ ...item, fileName: mediaFileName(item) }))
  );
  const multiViewGroups = groups.filter((group) => group.isGrouped);
  const unassignedGroups = groups.filter((group) => !group.files.some((file) => file.productId));
  const confirmedGroups = groups.filter((group) => group.isGrouped && group.files.every((file) => file.productId));
  const exactDuplicates = media.filter((item) => item.duplicateStatus === DUPLICATE_STATUS.DUPLICATE);
  const potentialDuplicates = media.filter((item) => item.duplicateStatus === DUPLICATE_STATUS.POSSIBLE_DUPLICATE);
  const storedGroups = getAllGroups().filter((group) => group.status !== "ARCHIVED");
  const variantCandidates = [
    ...media.filter((item) => Boolean(item.variantId)),
    ...storedGroups.filter((group) => group.variantReviewRequired),
  ];
  const potentialSameProductGroups = getPotentialProductGroups().filter((group) => !group.confirmed);

  const kidsMedia = media.filter((item) =>
    /^kids-\d{3}\.\w+$/i.test(mediaFileName(item))
  );
  const kidsDrafts = products.filter(
    (product) =>
      /^KID-\d{3}$/.test(String(product.id)) &&
      (product.status === PRODUCT_STATUS.DRAFT || product.status === PRODUCT_STATUS.PENDING_REVIEW)
  );
  const kidsPublished = products.filter(
    (product) => product.category === "kidswear" && product.status === PRODUCT_STATUS.PUBLISHED
  );

  return {
    products: {
      total: products.length,
      published,
      draft,
      review,
      archived,
      assigned: products.filter((product) => Boolean(product.assignedEmployeeId)).length,
    },
    media: {
      total: media.length,
      assigned: assignedMedia.length,
      unassigned: unassignedMedia.length,
      marketing: media.filter((item) => item.scope === MEDIA_SCOPES.MARKETING).length,
      draft: media.filter((item) => item.status === MEDIA_STATUS.DRAFT).length,
      review: media.filter((item) => item.status === MEDIA_STATUS.PENDING_REVIEW).length,
      active: media.filter((item) => item.status === MEDIA_STATUS.ACTIVE).length,
      orphaned: orphaned.length,
      duplicateOwnership: duplicateOwnership.length,
      invalidProductIds: orphaned.map((item) => ({ mediaId: item.id, productId: item.productId })),
      exactDuplicates: exactDuplicates.length,
      potentialDuplicates: potentialDuplicates.length,
      variantCandidates: variantCandidates.length,
    },
    groups: {
      multiView: multiViewGroups.length,
      potentialSameProduct: potentialSameProductGroups.length,
      unassigned: unassignedGroups.length,
      confirmed: confirmedGroups.length,
      stored: storedGroups.length,
    },
    kids: {
      totalMedia: kidsMedia.length,
      draftProducts: kidsDrafts.length,
      publishedProducts: kidsPublished.length,
      mediaWithValidOwnership: kidsMedia.filter(
        (item) =>
          item.productId &&
          productIds.has(String(item.productId)) &&
          !duplicateOwnership.some((records) => records.some((record) => record.id === item.id))
      ).length,
      mediaClaimedByDrafts: kidsMedia.filter(
        (item) =>
          kidsDrafts.some((product) => (product.mediaIds ?? []).some((id) => String(id) === String(item.id)))
      ).length,
    },
  };
};

export default {
  productIdPrefixFor,
  genderForCategory,
  nextStableProductId,
  preferredProductIdForMedia,
  validateMediaAssignment,
  transferMediaOwnership,
  unassignProductMedia,
  createProductDraftFromMedia,
  assignProductToEmployee,
  submitProductForReview,
  approveProduct,
  publishProduct,
  archiveProduct,
  changeProductId,
  employeeCanEditProduct,
  employeeAssignedProducts,
  saveEmployeeDraft,
  pickEmployeeEditableFields,
  EMPLOYEE_EDITABLE_FIELDS,
  getProductWorkflowView,
  getMediaInbox,
  getPotentialProductGroups,
  decideProductGroup,
  getWorkflowMetrics,
};

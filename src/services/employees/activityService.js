/**
 * PRATIKSHYA FASHON — Lightweight employee activity log.
 *
 * Structured so the future Admin Portal can consume it. This is not an
 * enterprise audit trail — just a readable house diary of people events.
 *
 * Passwords are never written here.
 */

import { INITIAL_ACTIVITY } from "../../data/employees/operations";
import { readStorage, writeStorage } from "../../utils/shopping";
import { employeeFullName } from "../../utils/employee";
import { EMPLOYEE_STORAGE_KEYS } from "./storage";

export const ACTIVITY_ACTIONS = {
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  ROLE_CHANGED: "ROLE_CHANGED",
  DEPARTMENT_CHANGED: "DEPARTMENT_CHANGED",
  PERMISSIONS_CHANGED: "PERMISSIONS_CHANGED",
  STATUS_CHANGED: "STATUS_CHANGED",
  EMPLOYEE_SUSPENDED: "EMPLOYEE_SUSPENDED",
  EMPLOYEE_ACTIVATED: "EMPLOYEE_ACTIVATED",
  EMPLOYEE_DEACTIVATED: "EMPLOYEE_DEACTIVATED",
  PASSWORD_RESET: "PASSWORD_RESET",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  LOGIN: "LOGIN",

  /* Media — Phase 12 & 12.1. Recorded in this same diary rather than a second log. */
  MEDIA_UPLOADED: "MEDIA_UPLOADED",
  MEDIA_SUBMITTED_FOR_REVIEW: "MEDIA_SUBMITTED_FOR_REVIEW",
  MEDIA_APPROVED: "MEDIA_APPROVED",
  MEDIA_REJECTED: "MEDIA_REJECTED",
  MEDIA_ASSIGNED: "MEDIA_ASSIGNED",
  MEDIA_COVER_CHANGED: "MEDIA_COVER_CHANGED",
  MEDIA_REORDERED: "MEDIA_REORDERED",
  MEDIA_EDITED: "MEDIA_EDITED",
  MEDIA_REMOVED: "MEDIA_REMOVED",
  MARKETING_MEDIA_ACTIVATED: "MARKETING_MEDIA_ACTIVATED",
  MARKETING_MEDIA_ARCHIVED: "MARKETING_MEDIA_ARCHIVED",

  /* Products — Phase 13. Recorded in this same diary, never a second log. */
  PRODUCT_CREATED: "PRODUCT_CREATED",
  PRODUCT_EDITED: "PRODUCT_EDITED",
  PRODUCT_PRICE_CHANGED: "PRODUCT_PRICE_CHANGED",
  PRODUCT_VARIANT_ADDED: "PRODUCT_VARIANT_ADDED",
  PRODUCT_VARIANT_UPDATED: "PRODUCT_VARIANT_UPDATED",
  PRODUCT_SUBMITTED: "PRODUCT_SUBMITTED",
  PRODUCT_APPROVED: "PRODUCT_APPROVED",
  PRODUCT_REJECTED: "PRODUCT_REJECTED",
  PRODUCT_PUBLISHED: "PRODUCT_PUBLISHED",
  PRODUCT_UNPUBLISHED: "PRODUCT_UNPUBLISHED",
  PRODUCT_ARCHIVED: "PRODUCT_ARCHIVED",
  PRODUCT_RESTORED: "PRODUCT_RESTORED",
  PRODUCT_DUPLICATED: "PRODUCT_DUPLICATED",
  PRODUCT_BULK_UPDATED: "PRODUCT_BULK_UPDATED",

  /* Inventory — Phase 14. The stock ledger holds quantity-level detail;
     this shared diary carries the readable cross-module activity note. */
  INVENTORY_MOVEMENT: "INVENTORY_MOVEMENT",

  /* Returns — Phase 16.1. Full return operational lifecycle. */
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURN_APPROVED: "RETURN_APPROVED",
  RETURN_REJECTED: "RETURN_REJECTED",
  RETURN_PICKUP_SCHEDULED: "RETURN_PICKUP_SCHEDULED",
  RETURN_RECEIVED: "RETURN_RECEIVED",
  RETURN_INSPECTED: "RETURN_INSPECTED",
  RETURN_REFUND_REQUESTED: "RETURN_REFUND_REQUESTED",
  RETURN_REFUNDED: "RETURN_REFUNDED",

  /* Offers — Phase 17. Recorded in this same diary, never a second log. */
  OFFER_CREATED: "OFFER_CREATED",
  OFFER_UPDATED: "OFFER_UPDATED",
  OFFER_ACTIVATED: "OFFER_ACTIVATED",
  OFFER_PAUSED: "OFFER_PAUSED",
  OFFER_ARCHIVED: "OFFER_ARCHIVED",
  OFFER_REDEEMED: "OFFER_REDEEMED",
};

const ACTION_LABELS = {
  [ACTIVITY_ACTIONS.EMPLOYEE_CREATED]: "Employee created",
  [ACTIVITY_ACTIONS.EMPLOYEE_UPDATED]: "Employee updated",
  [ACTIVITY_ACTIONS.ROLE_CHANGED]: "Role changed",
  [ACTIVITY_ACTIONS.DEPARTMENT_CHANGED]: "Department changed",
  [ACTIVITY_ACTIONS.PERMISSIONS_CHANGED]: "Permissions updated",
  [ACTIVITY_ACTIONS.STATUS_CHANGED]: "Status changed",
  [ACTIVITY_ACTIONS.EMPLOYEE_SUSPENDED]: "Employee suspended",
  [ACTIVITY_ACTIONS.EMPLOYEE_ACTIVATED]: "Employee activated",
  [ACTIVITY_ACTIONS.EMPLOYEE_DEACTIVATED]: "Employee deactivated",
  [ACTIVITY_ACTIONS.PASSWORD_RESET]: "Password reset",
  [ACTIVITY_ACTIONS.PASSWORD_CHANGED]: "Password changed",
  [ACTIVITY_ACTIONS.LOGIN]: "Signed in",
  [ACTIVITY_ACTIONS.MEDIA_UPLOADED]: "Media added",
  [ACTIVITY_ACTIONS.MEDIA_SUBMITTED_FOR_REVIEW]: "Media submitted for review",
  [ACTIVITY_ACTIONS.MEDIA_APPROVED]: "Media approved",
  [ACTIVITY_ACTIONS.MEDIA_REJECTED]: "Media rejected",
  [ACTIVITY_ACTIONS.MEDIA_ASSIGNED]: "Media assigned",
  [ACTIVITY_ACTIONS.MEDIA_COVER_CHANGED]: "Cover changed",
  [ACTIVITY_ACTIONS.MEDIA_REORDERED]: "Media reordered",
  [ACTIVITY_ACTIONS.MEDIA_EDITED]: "Media edited",
  [ACTIVITY_ACTIONS.MEDIA_REMOVED]: "Media removed",
  [ACTIVITY_ACTIONS.MARKETING_MEDIA_ACTIVATED]: "Marketing media activated",
  [ACTIVITY_ACTIONS.MARKETING_MEDIA_ARCHIVED]: "Marketing media archived",
  [ACTIVITY_ACTIONS.PRODUCT_CREATED]: "Product created",
  [ACTIVITY_ACTIONS.PRODUCT_EDITED]: "Product edited",
  [ACTIVITY_ACTIONS.PRODUCT_PRICE_CHANGED]: "Product price changed",
  [ACTIVITY_ACTIONS.PRODUCT_VARIANT_ADDED]: "Product variant added",
  [ACTIVITY_ACTIONS.PRODUCT_VARIANT_UPDATED]: "Product variant updated",
  [ACTIVITY_ACTIONS.PRODUCT_SUBMITTED]: "Product submitted for review",
  [ACTIVITY_ACTIONS.PRODUCT_APPROVED]: "Product approved",
  [ACTIVITY_ACTIONS.PRODUCT_REJECTED]: "Product rejected",
  [ACTIVITY_ACTIONS.PRODUCT_PUBLISHED]: "Product published",
  [ACTIVITY_ACTIONS.PRODUCT_UNPUBLISHED]: "Product unpublished",
  [ACTIVITY_ACTIONS.PRODUCT_ARCHIVED]: "Product archived",
  [ACTIVITY_ACTIONS.PRODUCT_RESTORED]: "Product restored",
  [ACTIVITY_ACTIONS.PRODUCT_DUPLICATED]: "Product duplicated",
  [ACTIVITY_ACTIONS.PRODUCT_BULK_UPDATED]: "Products updated in bulk",
  [ACTIVITY_ACTIONS.INVENTORY_MOVEMENT]: "Inventory updated",
  [ACTIVITY_ACTIONS.RETURN_REQUESTED]: "Return requested",
  [ACTIVITY_ACTIONS.RETURN_APPROVED]: "Return approved",
  [ACTIVITY_ACTIONS.RETURN_REJECTED]: "Return rejected",
  [ACTIVITY_ACTIONS.RETURN_PICKUP_SCHEDULED]: "Return pickup scheduled",
  [ACTIVITY_ACTIONS.RETURN_RECEIVED]: "Return received",
  [ACTIVITY_ACTIONS.RETURN_INSPECTED]: "Return inspected",
  [ACTIVITY_ACTIONS.RETURN_REFUND_REQUESTED]: "Refund requested",
  [ACTIVITY_ACTIONS.RETURN_REFUNDED]: "Refund completed",
  [ACTIVITY_ACTIONS.OFFER_CREATED]: "Offer created",
  [ACTIVITY_ACTIONS.OFFER_UPDATED]: "Offer updated",
  [ACTIVITY_ACTIONS.OFFER_ACTIVATED]: "Offer activated",
  [ACTIVITY_ACTIONS.OFFER_PAUSED]: "Offer paused",
  [ACTIVITY_ACTIONS.OFFER_ARCHIVED]: "Offer archived",
  [ACTIVITY_ACTIONS.OFFER_REDEEMED]: "Offer redeemed",
};

export const getActivityLabel = (action) => ACTION_LABELS[action] ?? "Activity";

/** Announced whenever the diary is written, so live views can re-sync. */
export const ACTIVITY_CHANGED_EVENT = "pratikshya-activity-changed";

const normaliseEntry = (entry) => {
  if (!entry || typeof entry !== "object" || !entry.id) return null;
  return {
    id: String(entry.id),
    at: entry.at || new Date().toISOString(),
    actorEmployeeId: entry.actorEmployeeId || null,
    actorName: entry.actorName || "System",
    targetEmployeeId: entry.targetEmployeeId || null,
    /* Phase 13 — product events reference the product they acted on. */
    targetProductId: entry.targetProductId || null,
    /* Phase 17 — offer events reference the offer they acted on. */
    targetOfferId: entry.targetOfferId || null,
    action: entry.action || ACTIVITY_ACTIONS.EMPLOYEE_UPDATED,
    summary: String(entry.summary || getActivityLabel(entry.action)),
  };
};

export const loadActivity = () => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.ACTIVITY, null);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.map(normaliseEntry).filter(Boolean);
  }
  const seeded = INITIAL_ACTIVITY.map(normaliseEntry).filter(Boolean);
  writeStorage(EMPLOYEE_STORAGE_KEYS.ACTIVITY, seeded);
  return seeded;
};

export const saveActivity = (entries) => {
  writeStorage(
    EMPLOYEE_STORAGE_KEYS.ACTIVITY,
    (Array.isArray(entries) ? entries : []).map(normaliseEntry).filter(Boolean)
  );
  /* Both portals keep live copies in context state; let them re-sync. */
  if (typeof window !== "undefined") {
    window.dispatchEvent(new Event(ACTIVITY_CHANGED_EVENT));
  }
};

export const recordActivity = (entries, draft) => {
  const entry = normaliseEntry({
    id: `act-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
    at: new Date().toISOString(),
    ...draft,
  });
  if (!entry) return entries;
  const next = [entry, ...entries].slice(0, 200);
  saveActivity(next);
  return next;
};

export const activityForEmployee = (entries, employeeId) =>
  entries.filter(
    (entry) =>
      entry.targetEmployeeId === employeeId || entry.actorEmployeeId === employeeId
  );

/** Phase 13 — the product-detail activity panel reads through this. */
export const activityForProduct = (entries, productId) =>
  entries.filter((entry) => entry.targetProductId === productId);

/** Phase 17 — the offer-detail activity panel reads through this. */
export const activityForOffer = (entries, offerId) =>
  entries.filter((entry) => entry.targetOfferId === offerId);

/**
 * Signs an entry for whoever acted. Employees carry `employeeId`; the
 * Admin Portal carries `adminId` and is its own authentication boundary.
 */
export const describeActor = (actor) => {
  if (!actor) return { actorEmployeeId: null, actorName: "System" };
  if (actor.adminId) {
    return {
      actorEmployeeId: null,
      actorName: actor.name ? `${actor.name} · ${actor.adminId}` : actor.adminId,
    };
  }
  if (actor.label) {
    return {
      actorEmployeeId: actor.employeeId || null,
      actorName: actor.employeeId ? `${actor.label} · ${actor.employeeId}` : actor.label,
    };
  }
  return {
    actorEmployeeId: actor.employeeId || null,
    actorName: employeeFullName(actor),
  };
};

export default {
  ACTIVITY_ACTIONS,
  ACTIVITY_CHANGED_EVENT,
  getActivityLabel,
  loadActivity,
  saveActivity,
  recordActivity,
  activityForEmployee,
  activityForProduct,
  describeActor,
};

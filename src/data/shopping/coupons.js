/**
 * PRATIKSHYA FASHON — Mock offers.
 *
 * Centralised demo coupon data for the Phase 6 bag. There is no coupon
 * engine behind this: each record carries its own eligibility predicate and
 * expiry, and `validateCoupon` is the one gate every application passes
 * through. A real offers service replaces this module without touching the
 * cart UI.
 *
 * Only the coupon code is ever persisted — it is re-validated against this
 * data on every load, so a stale or retired offer can never survive a
 * refresh.
 */

export const coupons = [
  {
    code: "WELCOME10",
    title: "Welcome to the atelier",
    summary: "10% off your first edit",
    percent: 10,
    minSubtotal: 2000,
    expiresAt: "2027-03-31",
    scopeLabel: "the full collection",
    appliesTo: () => true,
  },
  {
    code: "FESTIVE15",
    title: "The festive edit",
    summary: "15% off eligible festive pieces",
    percent: 15,
    minSubtotal: 5000,
    expiresAt: "2026-12-31",
    scopeLabel: "festive pieces",
    appliesTo: (product) => (product.occasion ?? []).includes("Festive"),
  },
  {
    code: "BRIDAL20",
    title: "The bridal atelier",
    summary: "20% off selected bridal pieces",
    percent: 20,
    minSubtotal: 10000,
    expiresAt: "2027-06-30",
    scopeLabel: "bridal pieces",
    appliesTo: (product) =>
      product.category === "bridal-couture" ||
      (product.occasion ?? []).includes("Bridal"),
  },
];

export const getCoupon = (code) =>
  coupons.find((coupon) => coupon.code === String(code ?? "").trim().toUpperCase()) ??
  null;

/** The one customer-facing refusal — technical detail stays out of the UI. */
export const COUPON_UNAVAILABLE_MESSAGE =
  "That offer isn't available for this collection.";

/**
 * Validates a code against the mock offer data and the current bag.
 * Checks existence, expiry, minimum order value, eligibility and duplicate
 * application; always answers in customer language.
 */
export function validateCoupon(code, items, { appliedCode = null } = {}) {
  const coupon = getCoupon(code);

  if (!coupon) {
    return { ok: false, message: COUPON_UNAVAILABLE_MESSAGE };
  }

  if (appliedCode && appliedCode === coupon.code) {
    return { ok: false, message: "This offer is already part of your order." };
  }

  if (new Date(`${coupon.expiresAt}T23:59:59`) < new Date()) {
    return { ok: false, message: "That offer has now closed." };
  }

  const eligible = items.some((item) => coupon.appliesTo(item.product));
  if (!eligible) {
    return { ok: false, message: COUPON_UNAVAILABLE_MESSAGE };
  }

  const subtotal = items.reduce(
    (total, item) => total + item.product.price * item.quantity,
    0
  );
  if (subtotal < coupon.minSubtotal) {
    return {
      ok: false,
      message: `This offer opens at ₹${coupon.minSubtotal.toLocaleString("en-IN")}.`,
    };
  }

  return { ok: true, coupon };
}

export default coupons;

/**
 * PRATIKSHYA FASHON — Order service.
 *
 * The seam between order state and where orders actually live. Today that
 * is namespaced localStorage over mock records; tomorrow it is an order
 * API, and only this module changes:
 *
 *   OrderContext → orderService → mock data / localStorage        (now)
 *   OrderContext → orderService → order API → backend → database  (later)
 *
 * Components never import this module and never touch localStorage — they
 * read the context. Every function here is pure apart from the two
 * explicit storage calls, so order behaviour stays testable.
 *
 * Only safe order information is persisted: pieces, pricing, delivery
 * snapshot, status and mock tracking. No card data, no credentials, no
 * payment secrets of any kind.
 */

import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
  canTransition,
} from "../../config/orderConfig";
import {
  buildInvoiceNumber,
  buildTrackingId,
  isOrderOwnedBy,
  normaliseOrder,
  normaliseOrders,
  pickCarrier,
  refundMethodLabel,
} from "../../utils/orders";
import { readStorage, writeStorage } from "../../utils/shopping";

export const ORDERS_STORAGE_KEY = "pratikshya_orders";
export const CURRENT_ORDER_KEY = "pratikshya_current_order";

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

/** Every stored order, repaired and newest first. Corrupt storage yields []. */
export const loadOrders = () => normaliseOrders(readStorage(ORDERS_STORAGE_KEY, null));

/** Persists the order list. Persistence is an enhancement, never a dependency. */
export const saveOrders = (orders) => {
  writeStorage(ORDERS_STORAGE_KEY, Array.isArray(orders) ? orders : []);
};

/** The id of the order the confirmation page is currently showing. */
export const loadCurrentOrderId = () => {
  const stored = readStorage(CURRENT_ORDER_KEY, null);
  if (typeof stored === "string") return stored;
  /* Phase 8 persisted the whole snapshot here; read the id out of it. */
  if (stored && typeof stored === "object" && stored.id) return String(stored.id);
  return null;
};

export const saveCurrentOrderId = (orderId) => {
  if (orderId) {
    writeStorage(CURRENT_ORDER_KEY, orderId);
    return;
  }
  try {
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(CURRENT_ORDER_KEY);
    }
  } catch {
    // Storage being unavailable never breaks the order experience.
  }
};

/* ------------------------------------------------------------------ */
/* Creation                                                            */
/* ------------------------------------------------------------------ */

/**
 * Upgrades a checkout snapshot into a full order record: mock tracking
 * identity, invoice identity, payment status derived from the method and
 * the first entry of the status history.
 */
export const buildOrderRecord = (snapshot) => {
  const base = normaliseOrder(snapshot);
  if (!base) return null;

  const isCod = base.paymentMethod.id === "cod";
  return {
    ...base,
    status: ORDER_STATUS.CONFIRMED,
    paymentStatus: isCod
      ? ORDER_PAYMENT_STATUS.PENDING
      : ORDER_PAYMENT_STATUS.PAID,
    statusHistory: [
      { status: ORDER_STATUS.PLACED, at: base.createdAt },
      { status: ORDER_STATUS.CONFIRMED, at: base.createdAt },
    ],
    tracking: {
      trackingId: buildTrackingId(base.id, base.createdAt),
      carrier: pickCarrier(base.id),
      origin: base.tracking.origin,
    },
    invoice: {
      number: buildInvoiceNumber(base.id),
      issuedAt: base.createdAt,
    },
    returns: [],
    refund: null,
    cancellation: null,
  };
};

/** Adds an order to the list, ignoring a duplicate id (double submit). */
export const addOrder = (orders, snapshot) => {
  const record = buildOrderRecord(snapshot);
  if (!record) return { ok: false, orders, order: null, message: "" };
  if (orders.some((order) => order.id === record.id)) {
    return {
      ok: true,
      orders,
      order: orders.find((order) => order.id === record.id),
      message: "",
    };
  }
  return {
    ok: true,
    orders: [record, ...orders],
    order: record,
    message: "Order placed.",
  };
};

/* ------------------------------------------------------------------ */
/* Reads                                                               */
/* ------------------------------------------------------------------ */

export const findOrder = (orders, orderId) =>
  orders.find((order) => order.id === orderId) ?? null;

/**
 * The orders a given identity may see. A signed-in customer sees their
 * own; a visitor with no session sees the guest orders from this browser.
 */
export const ordersForCustomer = (orders, customerId = null) =>
  orders.filter((order) => isOrderOwnedBy(order, customerId));

/**
 * An order read through an ownership check. `null` covers both "no such
 * order" and "not yours" so a page can never leak another customer's
 * details through a different error state.
 */
export const findOwnedOrder = (orders, orderId, customerId = null) => {
  const order = findOrder(orders, orderId);
  return order && isOrderOwnedBy(order, customerId) ? order : null;
};

/* ------------------------------------------------------------------ */
/* Writes                                                              */
/* ------------------------------------------------------------------ */

const replaceOrder = (orders, next) =>
  orders.map((order) => (order.id === next.id ? next : order));

/**
 * Moves an order to its next status, refusing any transition the state
 * machine does not allow. This is the only way an order status changes.
 */
export const applyStatus = (orders, orderId, nextStatus, at = new Date()) => {
  const order = findOrder(orders, orderId);
  if (!order) return { ok: false, orders, order: null, message: "Order not found." };
  if (!canTransition(order.status, nextStatus)) {
    return {
      ok: false,
      orders,
      order,
      message: "That is not a valid step for this order.",
    };
  }
  const stamped = at instanceof Date ? at.toISOString() : String(at);
  const next = {
    ...order,
    status: nextStatus,
    statusHistory: [...order.statusHistory, { status: nextStatus, at: stamped }],
  };
  return { ok: true, orders: replaceOrder(orders, next), order: next, message: "" };
};

/**
 * Cancels an order.
 *
 * Mock resolution only: a captured demo payment shows as refund initiated,
 * an uncaptured one (cash on delivery) shows as not captured. No money
 * moves anywhere — no payment gateway is contacted.
 */
export const cancelOrder = (orders, orderId, at = new Date()) => {
  const moved = applyStatus(orders, orderId, ORDER_STATUS.CANCELLED, at);
  if (!moved.ok) return moved;

  const order = moved.order;
  const wasCaptured = order.paymentStatus === ORDER_PAYMENT_STATUS.PAID;
  const stamped = at instanceof Date ? at.toISOString() : String(at);

  const next = {
    ...order,
    paymentStatus: wasCaptured
      ? ORDER_PAYMENT_STATUS.REFUND_INITIATED
      : ORDER_PAYMENT_STATUS.NOT_CAPTURED,
    refund: wasCaptured
      ? {
          amount: order.pricing.total,
          method: refundMethodLabel(order),
          status: ORDER_PAYMENT_STATUS.REFUND_INITIATED,
          initiatedAt: stamped,
          note: "Demo refund status — no real payment movement has taken place.",
        }
      : null,
    cancellation: { at: stamped, note: "Cancelled by the customer." },
  };

  return {
    ok: true,
    orders: replaceOrder(moved.orders, next),
    order: next,
    message: wasCaptured
      ? "Order cancelled. A refund has been initiated for this demo order."
      : "Order cancelled. Nothing was captured for this demo order.",
  };
};

/** Writes a return record onto its order (the return service composes it). */
export const attachReturn = (orders, orderId, record, orderStatus = null) => {
  const order = findOrder(orders, orderId);
  if (!order) return { ok: false, orders, order: null };

  let next = { ...order, returns: [...order.returns, record] };
  if (orderStatus && canTransition(order.status, orderStatus)) {
    next = {
      ...next,
      status: orderStatus,
      statusHistory: [
        ...order.statusHistory,
        { status: orderStatus, at: record.createdAt },
      ],
    };
  }
  return { ok: true, orders: replaceOrder(orders, next), order: next };
};

/** Replaces an existing return record on its order. */
export const updateReturn = (orders, orderId, record) => {
  const order = findOrder(orders, orderId);
  if (!order) return { ok: false, orders, order: null };
  const next = {
    ...order,
    returns: order.returns.map((entry) => (entry.id === record.id ? record : entry)),
  };
  return { ok: true, orders: replaceOrder(orders, next), order: next };
};

/**
 * Associates this browser's guest orders with a customer — used once,
 * after a guest signs up. Deliberately not an account-merging engine:
 * orders already belonging to someone are never touched.
 */
export const claimGuestOrders = (orders, customerId) => {
  if (!customerId) return { orders, claimed: 0 };
  let claimed = 0;
  const next = orders.map((order) => {
    if (order.customerId) return order;
    claimed += 1;
    return { ...order, customerId };
  });
  return { orders: claimed > 0 ? next : orders, claimed };
};

export default {
  ORDERS_STORAGE_KEY,
  CURRENT_ORDER_KEY,
  loadOrders,
  saveOrders,
  loadCurrentOrderId,
  saveCurrentOrderId,
  buildOrderRecord,
  addOrder,
  findOrder,
  findOwnedOrder,
  ordersForCustomer,
  applyStatus,
  cancelOrder,
  attachReturn,
  updateReturn,
  claimGuestOrders,
};

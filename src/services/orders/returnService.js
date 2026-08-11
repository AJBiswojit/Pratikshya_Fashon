/**
 * PRATIKSHYA FASHON — Return service.
 *
 * Return eligibility, validation, record creation and the demo return
 * timeline. Kept away from the UI so the return form only collects a
 * request and the rules live in exactly one place.
 *
 * Everything here is mock. No refund is ever processed, no payment
 * gateway is contacted, and refund states are clearly presented as demo
 * status. A backend returns API replaces this module later without the
 * return UI changing.
 */

import {
  ORDER_PAYMENT_STATUS,
  ORDER_STATUS,
  RETURN_JOURNEY,
  RETURN_STATUS,
  RETURN_STATUSES,
  canTransitionReturn,
  getReturnReason,
  getReturnResolution,
} from "../../config/orderConfig";
import {
  buildReturnId,
  canReturnOrder,
  refundAmountFor,
  refundMethodLabel,
  returnedLineIds,
} from "../../utils/orders";

/* ------------------------------------------------------------------ */
/* Eligibility                                                         */
/* ------------------------------------------------------------------ */

/**
 * The order lines a customer may still return, each carrying whether it
 * is already part of an existing request.
 */
export const returnableItems = (order) => {
  if (!order) return [];
  const covered = returnedLineIds(order);
  return order.items.map((item) => ({
    ...item,
    alreadyRequested: covered.has(item.lineId),
  }));
};

export const isReturnEligible = (order) => canReturnOrder(order);

/* ------------------------------------------------------------------ */
/* Validation                                                          */
/* ------------------------------------------------------------------ */

/**
 * Return request rules: at least one selectable item, a reason and a
 * resolution. The note is always optional. An empty request can never be
 * submitted.
 */
export const validateReturnRequest = ({
  order,
  lineIds = [],
  reason = "",
  resolution = "",
} = {}) => {
  const covered = returnedLineIds(order ?? {});
  const selectable = lineIds.filter(
    (lineId) =>
      !covered.has(lineId) && (order?.items ?? []).some((item) => item.lineId === lineId)
  );

  const errors = {
    items: selectable.length > 0 ? "" : "Please select at least one piece to return.",
    reason: getReturnReason(reason) ? "" : "Please choose a reason for the return.",
    resolution: getReturnResolution(resolution)
      ? ""
      : "Please choose how you would like this resolved.",
  };

  return {
    errors,
    ok: Object.values(errors).every((value) => !value),
    lineIds: selectable,
  };
};

/* ------------------------------------------------------------------ */
/* Creation                                                            */
/* ------------------------------------------------------------------ */

/**
 * Composes a return record for an order. Returns `{ ok, record, errors }`
 * — the caller (the order context) persists it; this function never
 * touches storage.
 */
export const createReturnRecord = ({
  order,
  lineIds = [],
  reason = "",
  resolution = "refund",
  note = "",
  at = new Date(),
}) => {
  if (!order) {
    return { ok: false, record: null, errors: {}, message: "Order not found." };
  }
  if (!isReturnEligible(order)) {
    return {
      ok: false,
      record: null,
      errors: {},
      message: "This order is not eligible for a return.",
    };
  }

  const validation = validateReturnRequest({ order, lineIds, reason, resolution });
  if (!validation.ok) {
    return {
      ok: false,
      record: null,
      errors: validation.errors,
      message: "Please complete your return request.",
    };
  }

  const items = order.items.filter((item) => validation.lineIds.includes(item.lineId));
  const stamped = at instanceof Date ? at.toISOString() : String(at);
  const sequence = (order.returns?.length ?? 0) + 1;
  const wantsRefund = resolution === "refund";
  const amount = refundAmountFor(items);

  const record = {
    id: buildReturnId(order.id, sequence),
    orderId: order.id,
    sequence,
    items: items.map((item) => ({ ...item })),
    reason,
    reasonLabel: getReturnReason(reason)?.label ?? "Other",
    resolution,
    note: String(note ?? "").trim().slice(0, 500),
    status: RETURN_STATUS.RETURN_REQUESTED,
    createdAt: stamped,
    history: [{ status: RETURN_STATUS.RETURN_REQUESTED, at: stamped }],
    refund: wantsRefund
      ? {
          amount,
          method: refundMethodLabel(order),
          status: ORDER_PAYMENT_STATUS.REFUND_INITIATED,
        }
      : null,
  };

  /* Every piece requested → the order itself enters the return flow. */
  const covered = returnedLineIds(order);
  const remaining = order.items.filter(
    (item) => !covered.has(item.lineId) && !validation.lineIds.includes(item.lineId)
  );

  return {
    ok: true,
    record,
    errors: {},
    orderStatus: remaining.length === 0 ? ORDER_STATUS.RETURN_REQUESTED : null,
    message: "Return requested.",
  };
};

/* ------------------------------------------------------------------ */
/* Progression                                                         */
/* ------------------------------------------------------------------ */

/** Moves a return record forward, refusing invalid transitions. */
export const advanceReturnRecord = (record, nextStatus, at = new Date()) => {
  if (!record) return { ok: false, record: null, message: "Return not found." };
  if (!canTransitionReturn(record.status, nextStatus)) {
    return {
      ok: false,
      record,
      message: "That is not a valid step for this return.",
    };
  }
  const stamped = at instanceof Date ? at.toISOString() : String(at);
  const refund = record.refund
    ? {
        ...record.refund,
        status:
          nextStatus === RETURN_STATUS.REFUNDED
            ? ORDER_PAYMENT_STATUS.REFUNDED
            : record.refund.status,
      }
    : null;

  return {
    ok: true,
    record: {
      ...record,
      status: nextStatus,
      history: [...record.history, { status: nextStatus, at: stamped }],
      refund,
    },
    message: "",
  };
};

/* ------------------------------------------------------------------ */
/* Timeline                                                            */
/* ------------------------------------------------------------------ */

/**
 * The return timeline, built the same way the shipment timeline is: one
 * generator, driven by the record's status and its own history.
 */
export const getReturnTimeline = (record) => {
  if (!record) return [];
  const history = new Map(record.history.map((entry) => [entry.status, entry.at]));
  const currentStage = RETURN_STATUSES[record.status]?.stage ?? null;
  const rejected = record.status === RETURN_STATUS.REJECTED;

  return RETURN_JOURNEY.map((status) => {
    const definition = RETURN_STATUSES[status];
    const done = currentStage !== null && definition.stage < currentStage;
    const current = currentStage !== null && definition.stage === currentStage;
    return {
      status,
      title: definition.label,
      description: definition.narrative,
      timestamp: history.get(status) ?? null,
      state: rejected ? "upcoming" : done ? "done" : current ? "current" : "upcoming",
    };
  });
};

export default {
  returnableItems,
  isReturnEligible,
  validateReturnRequest,
  createReturnRecord,
  advanceReturnRecord,
  getReturnTimeline,
};

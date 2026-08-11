/**
 * PRATIKSHYA FASHON — Tracking service.
 *
 * Generates the demo shipment timeline for an order from its status and
 * its recorded status history. One generator serves every order, so no
 * tracking array is ever hand-written per order.
 *
 * This is demonstration data. No courier API is contacted anywhere in the
 * application, the carrier names are fictional and the tracking id is
 * always presented as a Tracking ID, never as a real consignment number.
 * A real courier integration replaces this module without the tracking UI
 * changing at all.
 */

import {
  FULFILMENT_ORIGIN,
  ORDER_JOURNEY,
  ORDER_STATUS,
  ORDER_STATUSES,
  getOrderStatus,
} from "../../config/orderConfig";

/** Roughly how long each leg of the demo journey takes, in hours. */
const LEG_HOURS = {
  [ORDER_STATUS.PLACED]: 0,
  [ORDER_STATUS.CONFIRMED]: 1,
  [ORDER_STATUS.PROCESSING]: 8,
  [ORDER_STATUS.PACKED]: 22,
  [ORDER_STATUS.SHIPPED]: 30,
  [ORDER_STATUS.OUT_FOR_DELIVERY]: 54,
  [ORDER_STATUS.DELIVERED]: 60,
};

const addHours = (iso, hours) =>
  new Date(new Date(iso).getTime() + hours * 3600 * 1000).toISOString();

/** Where each leg of the demo journey happens. */
const legLocation = (status, order) => {
  const city = order.address?.city ? `${order.address.city}` : "Your city";
  switch (status) {
    case ORDER_STATUS.SHIPPED:
      return order.tracking?.origin ?? FULFILMENT_ORIGIN;
    case ORDER_STATUS.OUT_FOR_DELIVERY:
    case ORDER_STATUS.DELIVERED:
      return city;
    default:
      return order.tracking?.origin ?? FULFILMENT_ORIGIN;
  }
};

/**
 * The tracking view of an order:
 *
 *   status      — the current fulfilment status definition
 *   trackingId  — clearly-labelled mock tracking id
 *   carrier     — mock carrier name
 *   events      — every journey step, each marked done / current / upcoming
 *   cancelled   — the order left the journey
 *
 * Timestamps come from the order's own status history where it exists, so
 * a demo progression the client walked through reads back truthfully;
 * everything still ahead is projected from the order date.
 */
export const getTracking = (order) => {
  if (!order) return null;

  const history = new Map(
    (order.statusHistory ?? []).map((entry) => [entry.status, entry.at])
  );
  const currentStage = getOrderStatus(order.status).stage;
  const isCancelled = order.status === ORDER_STATUS.CANCELLED;
  const isReturnFlow =
    order.status === ORDER_STATUS.RETURN_REQUESTED ||
    order.status === ORDER_STATUS.RETURNED;

  /* A returned order still completed its delivery journey. */
  const reachedStage = isReturnFlow
    ? ORDER_STATUSES[ORDER_STATUS.DELIVERED].stage
    : currentStage;

  const events = ORDER_JOURNEY.map((status) => {
    const definition = ORDER_STATUSES[status];
    const recorded = history.get(status);
    const projected = addHours(order.createdAt, LEG_HOURS[status] ?? 0);
    const done = reachedStage !== null && definition.stage < reachedStage;
    const current = reachedStage !== null && definition.stage === reachedStage;

    return {
      status,
      title: definition.label,
      description: definition.narrative,
      timestamp: recorded ?? (done || current ? projected : null),
      projected: !recorded,
      location: legLocation(status, order),
      state: isCancelled ? "upcoming" : done ? "done" : current ? "current" : "upcoming",
    };
  });

  return {
    orderId: order.id,
    status: getOrderStatus(order.status),
    trackingId: order.tracking?.trackingId ?? null,
    carrier: order.tracking?.carrier ?? null,
    origin: order.tracking?.origin ?? FULFILMENT_ORIGIN,
    estimatedDelivery: order.estimatedDelivery ?? order.deliveryMethod?.estimate ?? "",
    deliveryMethod: order.deliveryMethod,
    cancelled: isCancelled,
    delivered: reachedStage === ORDER_STATUSES[ORDER_STATUS.DELIVERED].stage,
    events,
  };
};

export default { getTracking };

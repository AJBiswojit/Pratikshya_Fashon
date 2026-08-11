/**
 * PRATIKSHYA FASHON — Order configuration.
 *
 * The single home for every order-level definition the customer order
 * experience depends on: order statuses, payment statuses, return
 * statuses, the valid transitions between them, the demo return rules and
 * the mock courier vocabulary.
 *
 * Nothing in this file talks to a network. Status strings never appear as
 * literals inside JSX — components read labels, tone and stage order from
 * here, so the whole experience can never disagree with itself.
 *
 * Everything is clearly-labelled demo data for the current frontend stage;
 * each map is the seam a real order/fulfilment service replaces later.
 */

/* ------------------------------------------------------------------ */
/* Order status                                                        */
/* ------------------------------------------------------------------ */

export const ORDER_STATUS = {
  PLACED: "PLACED",
  CONFIRMED: "CONFIRMED",
  PROCESSING: "PROCESSING",
  PACKED: "PACKED",
  SHIPPED: "SHIPPED",
  OUT_FOR_DELIVERY: "OUT_FOR_DELIVERY",
  DELIVERED: "DELIVERED",
  CANCELLED: "CANCELLED",
  RETURN_REQUESTED: "RETURN_REQUESTED",
  RETURNED: "RETURNED",
};

/**
 * Customer-facing definition of each status.
 *
 * `stage` is the position in the fulfilment journey (null for the states
 * that sit outside it), `tone` maps to the Atelier badge palette and
 * `narrative` is the one line the tracking timeline prints.
 */
export const ORDER_STATUSES = {
  [ORDER_STATUS.PLACED]: {
    id: ORDER_STATUS.PLACED,
    label: "Placed",
    stage: 0,
    tone: "quiet",
    summary: "Your order has been received.",
    narrative: "Your order was received at the atelier.",
  },
  [ORDER_STATUS.CONFIRMED]: {
    id: ORDER_STATUS.CONFIRMED,
    label: "Confirmed",
    stage: 1,
    tone: "accent",
    summary: "Your order is confirmed.",
    narrative: "Your order is confirmed and queued for the atelier floor.",
  },
  [ORDER_STATUS.PROCESSING]: {
    id: ORDER_STATUS.PROCESSING,
    label: "Processing",
    stage: 2,
    tone: "accent",
    summary: "Your pieces are being prepared.",
    narrative: "Your pieces are being checked, pressed and prepared.",
  },
  [ORDER_STATUS.PACKED]: {
    id: ORDER_STATUS.PACKED,
    label: "Packed",
    stage: 3,
    tone: "accent",
    summary: "Your order is packed.",
    narrative: "Your order has been wrapped and sealed for dispatch.",
  },
  [ORDER_STATUS.SHIPPED]: {
    id: ORDER_STATUS.SHIPPED,
    label: "Shipped",
    stage: 4,
    tone: "ink",
    summary: "Your order is on its way.",
    narrative: "Your package has left our fulfilment centre.",
  },
  [ORDER_STATUS.OUT_FOR_DELIVERY]: {
    id: ORDER_STATUS.OUT_FOR_DELIVERY,
    label: "Out for Delivery",
    stage: 5,
    tone: "ink",
    summary: "Arriving today.",
    narrative: "Your package is out for delivery in your area.",
  },
  [ORDER_STATUS.DELIVERED]: {
    id: ORDER_STATUS.DELIVERED,
    label: "Delivered",
    stage: 6,
    tone: "ink",
    summary: "Delivered — we hope you love it.",
    narrative: "Your order was delivered.",
  },
  [ORDER_STATUS.CANCELLED]: {
    id: ORDER_STATUS.CANCELLED,
    label: "Cancelled",
    stage: null,
    tone: "muted",
    summary: "This order was cancelled.",
    narrative: "This order was cancelled at your request.",
  },
  [ORDER_STATUS.RETURN_REQUESTED]: {
    id: ORDER_STATUS.RETURN_REQUESTED,
    label: "Return Requested",
    stage: null,
    tone: "accent",
    summary: "A return has been requested.",
    narrative: "A return was requested for this order.",
  },
  [ORDER_STATUS.RETURNED]: {
    id: ORDER_STATUS.RETURNED,
    label: "Returned",
    stage: null,
    tone: "muted",
    summary: "This order has been returned.",
    narrative: "The returned pieces are back with the atelier.",
  },
};

/** The fulfilment journey, in order — the spine of the tracking timeline. */
export const ORDER_JOURNEY = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
  ORDER_STATUS.PACKED,
  ORDER_STATUS.SHIPPED,
  ORDER_STATUS.OUT_FOR_DELIVERY,
  ORDER_STATUS.DELIVERED,
];

/**
 * The only transitions the demo order state machine allows. An order can
 * never jump from PLACED to DELIVERED, and nothing moves out of a
 * terminal state.
 */
export const ORDER_TRANSITIONS = {
  [ORDER_STATUS.PLACED]: [ORDER_STATUS.CONFIRMED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.CONFIRMED]: [ORDER_STATUS.PROCESSING, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PROCESSING]: [ORDER_STATUS.PACKED, ORDER_STATUS.CANCELLED],
  [ORDER_STATUS.PACKED]: [ORDER_STATUS.SHIPPED],
  [ORDER_STATUS.SHIPPED]: [ORDER_STATUS.OUT_FOR_DELIVERY],
  [ORDER_STATUS.OUT_FOR_DELIVERY]: [ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.DELIVERED]: [ORDER_STATUS.RETURN_REQUESTED],
  [ORDER_STATUS.RETURN_REQUESTED]: [ORDER_STATUS.RETURNED, ORDER_STATUS.DELIVERED],
  [ORDER_STATUS.RETURNED]: [],
  [ORDER_STATUS.CANCELLED]: [],
};

/** Statuses a customer may cancel from — business rule, demo only. */
export const CANCELLABLE_STATUSES = [
  ORDER_STATUS.PLACED,
  ORDER_STATUS.CONFIRMED,
  ORDER_STATUS.PROCESSING,
];

/** Statuses a return may be raised from — demo rule. */
export const RETURNABLE_STATUSES = [ORDER_STATUS.DELIVERED];

/** True when `next` is a legal move from `current`. */
export const canTransition = (current, next) =>
  Boolean(ORDER_TRANSITIONS[current]?.includes(next));

/** The next step of the fulfilment journey, or null at the end of it. */
export const nextJourneyStatus = (current) => {
  const index = ORDER_JOURNEY.indexOf(current);
  if (index === -1 || index === ORDER_JOURNEY.length - 1) return null;
  return ORDER_JOURNEY[index + 1];
};

/** Safe status definition lookup — an unknown status never breaks a page. */
export const getOrderStatus = (status) =>
  ORDER_STATUSES[status] ?? ORDER_STATUSES[ORDER_STATUS.CONFIRMED];

/* ------------------------------------------------------------------ */
/* Order history filters                                               */
/* ------------------------------------------------------------------ */

/**
 * The order history filters. Each one is a named set of statuses, so the
 * page never tests status strings itself.
 */
export const ORDER_FILTERS = [
  { id: "all", label: "All", statuses: null },
  {
    id: "processing",
    label: "Processing",
    statuses: [
      ORDER_STATUS.PLACED,
      ORDER_STATUS.CONFIRMED,
      ORDER_STATUS.PROCESSING,
      ORDER_STATUS.PACKED,
    ],
  },
  {
    id: "shipped",
    label: "Shipped",
    statuses: [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY],
  },
  { id: "delivered", label: "Delivered", statuses: [ORDER_STATUS.DELIVERED] },
  { id: "cancelled", label: "Cancelled", statuses: [ORDER_STATUS.CANCELLED] },
  {
    id: "returned",
    label: "Returned",
    statuses: [ORDER_STATUS.RETURN_REQUESTED, ORDER_STATUS.RETURNED],
  },
];

/* ------------------------------------------------------------------ */
/* Payment status                                                      */
/* ------------------------------------------------------------------ */

/**
 * The payment state recorded on an order. Distinct from the in-flight
 * payment session states in `services/payment/paymentService.js`: this is
 * what the order says about money, not what a gateway is doing.
 */
export const ORDER_PAYMENT_STATUS = {
  PAID: "PAID",
  PENDING: "PENDING",
  NOT_CAPTURED: "NOT_CAPTURED",
  REFUND_INITIATED: "REFUND_INITIATED",
  REFUNDED: "REFUNDED",
};

export const PAYMENT_STATUSES = {
  [ORDER_PAYMENT_STATUS.PAID]: {
    id: ORDER_PAYMENT_STATUS.PAID,
    label: "Paid",
    tone: "ink",
  },
  [ORDER_PAYMENT_STATUS.PENDING]: {
    id: ORDER_PAYMENT_STATUS.PENDING,
    label: "Payment Pending",
    tone: "quiet",
  },
  [ORDER_PAYMENT_STATUS.NOT_CAPTURED]: {
    id: ORDER_PAYMENT_STATUS.NOT_CAPTURED,
    label: "Payment Not Captured",
    tone: "muted",
  },
  [ORDER_PAYMENT_STATUS.REFUND_INITIATED]: {
    id: ORDER_PAYMENT_STATUS.REFUND_INITIATED,
    label: "Refund Initiated",
    tone: "accent",
  },
  [ORDER_PAYMENT_STATUS.REFUNDED]: {
    id: ORDER_PAYMENT_STATUS.REFUNDED,
    label: "Refunded",
    tone: "accent",
  },
};

export const getPaymentStatus = (status) =>
  PAYMENT_STATUSES[status] ?? PAYMENT_STATUSES[ORDER_PAYMENT_STATUS.PENDING];

/* ------------------------------------------------------------------ */
/* Return status                                                       */
/* ------------------------------------------------------------------ */

export const RETURN_STATUS = {
  RETURN_REQUESTED: "RETURN_REQUESTED",
  UNDER_REVIEW: "UNDER_REVIEW",
  APPROVED: "APPROVED",
  PICKUP_SCHEDULED: "PICKUP_SCHEDULED",
  RECEIVED: "RECEIVED",
  REFUND_INITIATED: "REFUND_INITIATED",
  REFUNDED: "REFUNDED",
  REJECTED: "REJECTED",
};

export const RETURN_STATUSES = {
  [RETURN_STATUS.RETURN_REQUESTED]: {
    id: RETURN_STATUS.RETURN_REQUESTED,
    label: "Return Requested",
    stage: 0,
    tone: "accent",
    narrative: "Your return request has been received.",
  },
  [RETURN_STATUS.UNDER_REVIEW]: {
    id: RETURN_STATUS.UNDER_REVIEW,
    label: "Under Review",
    stage: 1,
    tone: "accent",
    narrative: "Our care team is reviewing your request.",
  },
  [RETURN_STATUS.APPROVED]: {
    id: RETURN_STATUS.APPROVED,
    label: "Approved",
    stage: 2,
    tone: "accent",
    narrative: "Your return has been approved.",
  },
  [RETURN_STATUS.PICKUP_SCHEDULED]: {
    id: RETURN_STATUS.PICKUP_SCHEDULED,
    label: "Pickup Scheduled",
    stage: 3,
    tone: "accent",
    narrative: "A pickup has been scheduled from your delivery address.",
  },
  [RETURN_STATUS.RECEIVED]: {
    id: RETURN_STATUS.RECEIVED,
    label: "Received",
    stage: 4,
    tone: "ink",
    narrative: "Your pieces are back with the atelier and have been inspected.",
  },
  [RETURN_STATUS.REFUND_INITIATED]: {
    id: RETURN_STATUS.REFUND_INITIATED,
    label: "Refund Initiated",
    stage: 5,
    tone: "ink",
    narrative: "Your refund has been initiated to the original payment method.",
  },
  [RETURN_STATUS.REFUNDED]: {
    id: RETURN_STATUS.REFUNDED,
    label: "Refunded",
    stage: 6,
    tone: "ink",
    narrative: "Your refund is complete.",
  },
  [RETURN_STATUS.REJECTED]: {
    id: RETURN_STATUS.REJECTED,
    label: "Not Approved",
    stage: null,
    tone: "muted",
    narrative: "This return could not be approved.",
  },
};

/** The return journey, in order — the spine of the return timeline. */
export const RETURN_JOURNEY = [
  RETURN_STATUS.RETURN_REQUESTED,
  RETURN_STATUS.UNDER_REVIEW,
  RETURN_STATUS.APPROVED,
  RETURN_STATUS.PICKUP_SCHEDULED,
  RETURN_STATUS.RECEIVED,
  RETURN_STATUS.REFUND_INITIATED,
  RETURN_STATUS.REFUNDED,
];

export const RETURN_TRANSITIONS = {
  [RETURN_STATUS.RETURN_REQUESTED]: [
    RETURN_STATUS.UNDER_REVIEW,
    RETURN_STATUS.REJECTED,
  ],
  [RETURN_STATUS.UNDER_REVIEW]: [RETURN_STATUS.APPROVED, RETURN_STATUS.REJECTED],
  [RETURN_STATUS.APPROVED]: [RETURN_STATUS.PICKUP_SCHEDULED],
  [RETURN_STATUS.PICKUP_SCHEDULED]: [RETURN_STATUS.RECEIVED],
  [RETURN_STATUS.RECEIVED]: [RETURN_STATUS.REFUND_INITIATED],
  [RETURN_STATUS.REFUND_INITIATED]: [RETURN_STATUS.REFUNDED],
  [RETURN_STATUS.REFUNDED]: [],
  [RETURN_STATUS.REJECTED]: [],
};

/** Return states that still hold the items — a second request is blocked. */
export const ACTIVE_RETURN_STATUSES = [
  RETURN_STATUS.RETURN_REQUESTED,
  RETURN_STATUS.UNDER_REVIEW,
  RETURN_STATUS.APPROVED,
  RETURN_STATUS.PICKUP_SCHEDULED,
  RETURN_STATUS.RECEIVED,
  RETURN_STATUS.REFUND_INITIATED,
  RETURN_STATUS.REFUNDED,
];

export const canTransitionReturn = (current, next) =>
  Boolean(RETURN_TRANSITIONS[current]?.includes(next));

export const nextReturnStatus = (current) => {
  const index = RETURN_JOURNEY.indexOf(current);
  if (index === -1 || index === RETURN_JOURNEY.length - 1) return null;
  return RETURN_JOURNEY[index + 1];
};

export const getReturnStatus = (status) =>
  RETURN_STATUSES[status] ?? RETURN_STATUSES[RETURN_STATUS.RETURN_REQUESTED];

/* ------------------------------------------------------------------ */
/* Return request vocabulary                                           */
/* ------------------------------------------------------------------ */

export const RETURN_REASONS = [
  { id: "size", label: "Wrong size" },
  { id: "colour", label: "Colour different from expectation" },
  { id: "damaged", label: "Damaged item" },
  { id: "wrong-item", label: "Received wrong item" },
  { id: "quality", label: "Quality issue" },
  { id: "changed-mind", label: "Changed my mind" },
  { id: "other", label: "Other" },
];

export const RETURN_RESOLUTIONS = [
  {
    id: "refund",
    label: "Refund",
    description: "Refunded to the original payment method.",
  },
  {
    id: "exchange",
    label: "Exchange",
    description: "Exchanged for another size or colour, subject to availability.",
  },
];

export const getReturnReason = (id) =>
  RETURN_REASONS.find((reason) => reason.id === id) ?? null;

export const getReturnResolution = (id) =>
  RETURN_RESOLUTIONS.find((resolution) => resolution.id === id) ?? null;

/**
 * The concise, clearly-labelled demo policy line shown above the return
 * form. Deliberately not a legal policy — the client has not provided one.
 */
export const RETURN_POLICY_SUMMARY =
  "Eligible items can be returned within the applicable return window. Pieces should be unworn, with their original tags and packaging intact.";

/* ------------------------------------------------------------------ */
/* Mock courier vocabulary                                             */
/* ------------------------------------------------------------------ */

/**
 * Fictional carrier names used for the demo tracking experience. No
 * courier API is connected at this stage, and none of these are real
 * logistics partners.
 */
export const MOCK_CARRIERS = [
  "Atelier Express",
  "Meridian Courier",
  "Saffron Logistics",
  "Indus Freight Line",
];

/** The atelier's mock dispatch origin. */
export const FULFILMENT_ORIGIN = "Bhubaneswar, Odisha";

/** The label every mock tracking number is shown under. */
export const TRACKING_ID_LABEL = "Tracking ID";

export default {
  ORDER_STATUS,
  ORDER_STATUSES,
  ORDER_JOURNEY,
  ORDER_TRANSITIONS,
  ORDER_FILTERS,
  CANCELLABLE_STATUSES,
  RETURNABLE_STATUSES,
  canTransition,
  nextJourneyStatus,
  getOrderStatus,
  ORDER_PAYMENT_STATUS,
  PAYMENT_STATUSES,
  getPaymentStatus,
  RETURN_STATUS,
  RETURN_STATUSES,
  RETURN_JOURNEY,
  RETURN_TRANSITIONS,
  ACTIVE_RETURN_STATUSES,
  canTransitionReturn,
  nextReturnStatus,
  getReturnStatus,
  RETURN_REASONS,
  RETURN_RESOLUTIONS,
  RETURN_POLICY_SUMMARY,
  MOCK_CARRIERS,
  FULFILMENT_ORIGIN,
  TRACKING_ID_LABEL,
};

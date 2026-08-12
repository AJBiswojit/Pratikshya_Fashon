/**
 * PRATIKSHYA FASHON — Order validation centralization (Phase 15)
 *
 * Every guard lives here exactly once:
 * isValidTransition, canCancelOrder, canReturnOrder, canFulfillOrder,
 * canDispatchOrder, canDeliverOrder, etc.
 *
 * Components and services call these — never duplicate rules in JSX.
 */

import {
  ORDER_STATUS,
  CANCELLABLE_STATUSES,
  ADMIN_CANCELLABLE_STATUSES,
  RETURNABLE_STATUSES,
  ORDER_TRANSITIONS,
  FULFILLMENT_STATUS,
} from "../../config/orderConfig";
import { returnedLineIds } from "../../utils/orders";

export const isValidTransition = (current, next) =>
  Boolean(ORDER_TRANSITIONS[current]?.includes(next));

export const canCancelOrder = (order, actorRole = "CUSTOMER") => {
  if (!order) return false;
  if (order.status === ORDER_STATUS.CANCELLED) return false;
  if (order.status === ORDER_STATUS.DELIVERED) return false;
  if (order.status === ORDER_STATUS.SHIPPED || order.status === ORDER_STATUS.OUT_FOR_DELIVERY) {
    // Only admin override allowed after shipment
    return actorRole === "SUPER_ADMIN" || actorRole === "ADMIN";
  }
  // If stock exception or payment hold may still allow admin cancel
  if (ADMIN_CANCELLABLE_STATUSES.includes(order.status)) return true;
  return CANCELLABLE_STATUSES.includes(order.status);
};

export const canFulfillOrder = (order) => {
  if (!order) return false;
  if (order.status === ORDER_STATUS.CANCELLED) return false;
  if (order.fulfillment?.status === FULFILLMENT_STATUS.CANCELLED) return false;
  // Must be confirmed/processing/allocated
  return [
    ORDER_STATUS.ORDER_CONFIRMED,
    ORDER_STATUS.CONFIRMED,
    ORDER_STATUS.PROCESSING,
    ORDER_STATUS.ALLOCATED,
    ORDER_STATUS.PICKING,
    ORDER_STATUS.PACKED,
    ORDER_STATUS.READY_TO_DISPATCH,
  ].includes(order.status);
};

export const canAllocateOrder = (order) => {
  if (!order) return false;
  return [ORDER_STATUS.PROCESSING, ORDER_STATUS.ORDER_CONFIRMED, ORDER_STATUS.CONFIRMED].includes(order.status);
};

export const canPickOrder = (order) => {
  if (!order) return false;
  return [ORDER_STATUS.ALLOCATED, ORDER_STATUS.PICKING].includes(order.status);
};

export const canPackOrder = (order) => {
  if (!order) return false;
  // Must be fully picked
  if (order.status !== ORDER_STATUS.PICKING) return false;
  const picking = order.fulfillment?.picking || {};
  const items = order.items || [];
  const allPicked = items.every((item) => picking[item.lineId]?.picked);
  return allPicked;
};

export const canDispatchOrder = (order) => {
  if (!order) return false;
  return order.status === ORDER_STATUS.READY_TO_DISPATCH;
};

export const canDeliverOrder = (order) => {
  if (!order) return false;
  return [ORDER_STATUS.SHIPPED, ORDER_STATUS.OUT_FOR_DELIVERY].includes(order.status);
};

export const canReturnOrder = (order) => {
  if (!order) return false;
  if (!RETURNABLE_STATUSES.includes(order.status)) return false;
  const covered = returnedLineIds(order);
  return order.items.some((item) => !covered.has(item.lineId));
};

export const canMarkPicked = (order, lineId) => {
  if (!order || !lineId) return false;
  if (!canPickOrder(order)) return false;
  return Boolean(order.items.find((i) => i.lineId === lineId));
};

export const hasPaymentHold = (order) => {
  if (!order) return true;
  const payment = order.paymentStatus;
  return ["PENDING", "FAILED", "NOT_CAPTURED"].includes(payment);
};

export const hasStockException = (order) => {
  if (!order) return false;
  return order.fulfillment?.hasStockException === true || order.hasStockException === true;
};

export const isOrderEligibleForReturn = canReturnOrder;

export const getAllowedTransitions = (status) => ORDER_TRANSITIONS[status] || [];

export default {
  isValidTransition,
  canCancelOrder,
  canFulfillOrder,
  canAllocateOrder,
  canPickOrder,
  canPackOrder,
  canDispatchOrder,
  canDeliverOrder,
  canReturnOrder,
  canMarkPicked,
  hasPaymentHold,
  hasStockException,
  getAllowedTransitions,
};

/**
 * PRATIKSHYA FASHON — Mock order state.
 *
 * The lightweight frontend record of placed demo orders. Phase 8 only
 * stores what a successful mock payment produces — no backend, no real
 * order service. The shape is deliberately ready for future order history,
 * detail, tracking, returns and invoice pages without implementing any of
 * them yet.
 *
 * Storage holds mock order snapshots only: no card data, no secrets, no
 * real payment information of any kind.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { readStorage, writeStorage } from "../utils/shopping";

export const ORDERS_STORAGE_KEY = "pratikshya_orders";
export const CURRENT_ORDER_KEY = "pratikshya_current_order";

const OrderContext = createContext(null);

/** Restores orders + the current order, discarding corrupt storage. */
const restoreOrders = () => {
  const stored = readStorage(ORDERS_STORAGE_KEY, null);
  const current = readStorage(CURRENT_ORDER_KEY, null);
  return {
    orders: Array.isArray(stored) ? stored : [],
    currentOrder:
      current && typeof current === "object" && current.id ? current : null,
  };
};

export function OrderProvider({ children }) {
  const [{ orders, currentOrder }, setState] = useState(restoreOrders);

  useEffect(() => {
    writeStorage(ORDERS_STORAGE_KEY, orders);
  }, [orders]);

  useEffect(() => {
    if (currentOrder) {
      writeStorage(CURRENT_ORDER_KEY, currentOrder);
    } else {
      try {
        if (typeof window !== "undefined") {
          window.localStorage.removeItem(CURRENT_ORDER_KEY);
        }
      } catch {
        // Storage being unavailable never breaks the order state.
      }
    }
  }, [currentOrder]);

  /**
   * Records a mock order snapshot and marks it as the current order —
   * called exactly once, after a successful payment.
   */
  const placeOrder = useCallback((snapshot) => {
    if (!snapshot?.id) return { ok: false, message: "" };
    setState((current) => ({
      orders: [snapshot, ...current.orders],
      currentOrder: snapshot,
    }));
    return { ok: true, message: "Order placed." };
  }, []);

  /** Clears the current-order pointer (never the history). */
  const clearCurrentOrder = useCallback(() => {
    setState((current) => ({ ...current, currentOrder: null }));
  }, []);

  /** Orders belonging to a customer id, newest first. */
  const ordersForCustomer = useCallback(
    (customerId) =>
      customerId ? orders.filter((order) => order.customerId === customerId) : [],
    [orders]
  );

  const value = useMemo(
    () => ({
      orders,
      currentOrder,
      placeOrder,
      clearCurrentOrder,
      ordersForCustomer,
    }),
    [orders, currentOrder, placeOrder, clearCurrentOrder, ordersForCustomer]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

/** Accessor for mock order state; inert when no provider is mounted. */
export function useOrder() {
  return (
    useContext(OrderContext) ?? {
      orders: [],
      currentOrder: null,
      placeOrder: () => ({ ok: false, message: "" }),
      clearCurrentOrder: () => {},
      ordersForCustomer: () => [],
    }
  );
}

export default OrderContext;

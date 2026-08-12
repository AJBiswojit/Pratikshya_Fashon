/**
 * PRATIKSHYA FASHON — Order state.
 *
 * The single source of truth for placed demo orders: creation from a
 * successful checkout, history, ownership, status progression,
 * cancellation, returns and tracking. Every order page reads this context;
 * nothing in the UI touches localStorage, and there is exactly one order
 * implementation behind it.
 *
 *   OrderContext
 *     └── services/orders/orderService     (persistence + writes)
 *         ├── services/orders/trackingService (mock shipment timeline)
 *         └── services/orders/returnService   (return rules + records)
 *
 * Later, the service layer alone is swapped for an order API — the
 * context surface and the pages stay as they are.
 *
 * Storage holds mock order snapshots only: no card data, no credentials,
 * no real payment information of any kind.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useAuth } from "./AuthContext";
import { ORDER_STATUS, RETURN_STATUS, nextJourneyStatus } from "../config/orderConfig";
import * as orderService from "../services/orders/orderService";
import { getTracking as buildTracking } from "../services/orders/trackingService";
import {
  advanceReturnRecord,
  createReturnRecord,
} from "../services/orders/returnService";
import { latestReturn } from "../utils/orders";
import inventoryRepository from "../services/inventory/inventoryRepository";

export const ORDERS_STORAGE_KEY = orderService.ORDERS_STORAGE_KEY;
export const CURRENT_ORDER_KEY = orderService.CURRENT_ORDER_KEY;

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const { user } = useAuth();
  const customerId = user?.id ?? null;

  const [orders, setOrders] = useState(() => orderService.loadOrders());
  const [currentOrderId, setCurrentOrderId] = useState(() =>
    orderService.loadCurrentOrderId()
  );

  /* Latest orders, for callbacks that must read fresh state synchronously. */
  const ordersRef = useRef(orders);
  ordersRef.current = orders;

  useEffect(() => {
    orderService.saveOrders(orders);
  }, [orders]);

  useEffect(() => {
    orderService.saveCurrentOrderId(currentOrderId);
  }, [currentOrderId]);

  /* ---------------------------------------------------------------- */
  /* Reads                                                             */
  /* ---------------------------------------------------------------- */

  /** Every order visible to the current identity, newest first. */
  const customerOrders = useMemo(
    () => orderService.ordersForCustomer(orders, customerId),
    [orders, customerId]
  );

  /** Guest orders placed in this browser while signed in — claimable. */
  const guestOrderCount = useMemo(
    () => (customerId ? orders.filter((order) => !order.customerId).length : 0),
    [orders, customerId]
  );

  const getOrders = useCallback(() => ordersRef.current, []);

  /** An order read through the ownership check — never another customer's. */
  const getOrderById = useCallback(
    (orderId) =>
      orderService.findOwnedOrder(ordersRef.current, orderId, customerId),
    [customerId]
  );

  const getCustomerOrders = useCallback(
    (id = customerId) => orderService.ordersForCustomer(ordersRef.current, id),
    [customerId]
  );

  /**
   * The order behind the confirmation page. This pointer belongs to the
   * browser session that just checked out, so it is not ownership-filtered
   * — a guest who signs up immediately after paying must still see their
   * own confirmation.
   */
  const currentOrder = useMemo(
    () => (currentOrderId ? orderService.findOrder(orders, currentOrderId) : null),
    [orders, currentOrderId]
  );

  const getTracking = useCallback(
    (orderId) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      return order ? buildTracking(order) : null;
    },
    [customerId]
  );

  /** The most recent return on an order, or a specific one by return id. */
  const getReturn = useCallback(
    (orderId, returnId = null) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      if (!order) return null;
      if (returnId) {
        return order.returns.find((record) => record.id === returnId) ?? null;
      }
      return latestReturn(order);
    },
    [customerId]
  );

  /* ---------------------------------------------------------------- */
  /* Writes                                                            */
  /* ---------------------------------------------------------------- */

  /**
   * Records an order from a successful checkout and marks it as current.
   * The order that appears on the confirmation page is the very same
   * record the account order history reads.
   */
  const createOrder = useCallback((snapshot) => {
    const result = orderService.addOrder(ordersRef.current, snapshot);
    if (!result.ok || !result.order) return { ok: false, order: null, message: "" };
    ordersRef.current = result.orders;
    setOrders(result.orders);
    setCurrentOrderId(result.order.id);
    return { ok: true, order: result.order, message: result.message };
  }, []);

  /** Clears the confirmation pointer — never the history. */
  const clearCurrentOrder = useCallback(() => setCurrentOrderId(null), []);

  /**
   * Moves an order along the demo fulfilment journey. Only transitions the
   * centralised state machine allows are applied; the customer-facing demo
   * control simply asks for the next step.
   */
  const updateMockOrderStatus = useCallback(
    (orderId, nextStatus = null) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      if (!order) return { ok: false, message: "Order not found." };

      const target = nextStatus ?? nextJourneyStatus(order.status);
      if (!target) {
        return { ok: false, message: "This order has completed its journey." };
      }

      const result = orderService.applyStatus(ordersRef.current, orderId, target);
      if (!result.ok) return { ok: false, message: result.message };
      ordersRef.current = result.orders;
      setOrders(result.orders);
      return { ok: true, order: result.order, message: result.message };
    },
    [customerId]
  );

  /** Cancels an eligible order. Mock resolution only — no money moves. */
  const cancelOrder = useCallback(
    (orderId) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      if (!order) return { ok: false, message: "Order not found." };

      const result = orderService.cancelOrder(ordersRef.current, orderId);
      if (!result.ok) {
        return {
          ok: false,
          message:
            result.message ||
            "This order can no longer be cancelled. Please contact the atelier.",
        };
      }

      /* A successful checkout has already converted its reservation to a
         sale. Cancellation restores those exact allocations before the
         order transition is persisted; legacy orders without a reservation
         link keep their existing Phase 9 behaviour. */
      if (result.order.inventoryReservationId) {
        const restock = inventoryRepository.restockCancelledOrder(result.order, {
          label: result.order.customer?.fullName || "Customer",
        });
        if (!restock.ok) {
          return {
            ok: false,
            message: restock.error || "Inventory could not be restored, so the order was not cancelled.",
          };
        }
      }

      ordersRef.current = result.orders;
      setOrders(result.orders);
      return { ok: true, order: result.order, message: result.message };
    },
    [customerId]
  );

  /**
   * Creates a return request against an owned, eligible order. Duplicate
   * requests for the same pieces are refused by the return service.
   */
  const createReturn = useCallback(
    ({ orderId, lineIds, reason, resolution, note }) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      if (!order) {
        return { ok: false, errors: {}, message: "Order not found." };
      }

      const built = createReturnRecord({
        order,
        lineIds,
        reason,
        resolution,
        note,
      });
      if (!built.ok) return built;

      const attached = orderService.attachReturn(
        ordersRef.current,
        orderId,
        built.record,
        built.orderStatus
      );
      if (!attached.ok) {
        return { ok: false, errors: {}, message: "Return could not be created." };
      }
      ordersRef.current = attached.orders;
      setOrders(attached.orders);
      return { ok: true, record: built.record, errors: {}, message: built.message };
    },
    [customerId]
  );

  /** Advances a return along its demo journey (client demo control). */
  const updateMockReturnStatus = useCallback(
    (orderId, returnId, nextStatus) => {
      const order = orderService.findOwnedOrder(
        ordersRef.current,
        orderId,
        customerId
      );
      const record = order?.returns.find((entry) => entry.id === returnId) ?? null;
      if (!record) return { ok: false, message: "Return not found." };

      const advanced = advanceReturnRecord(record, nextStatus);
      if (!advanced.ok) return { ok: false, message: advanced.message };

      const updated = orderService.updateReturn(
        ordersRef.current,
        orderId,
        advanced.record
      );
      if (!updated.ok) return { ok: false, message: "Return could not be updated." };
      ordersRef.current = updated.orders;
      setOrders(updated.orders);
      /* Received customer returns enter inventory quarantine exactly once.
         Inspection into sellable/damaged stock remains an authorised
         inventory operation, never an automatic customer-side decision. */
      if (nextStatus === RETURN_STATUS.RECEIVED) {
        inventoryRepository.recordOrderReturn(advanced.record);
      }
      return { ok: true, record: advanced.record, message: "" };
    },
    [customerId]
  );

  /**
   * Associates the guest orders placed in this browser with a customer —
   * used once, after a guest creates an account. Orders that already
   * belong to someone are never reassigned.
   */
  const claimGuestOrders = useCallback(
    (id = customerId) => {
      if (!id) return { ok: false, claimed: 0 };
      const result = orderService.claimGuestOrders(ordersRef.current, id);
      if (result.claimed === 0) return { ok: false, claimed: 0 };
      ordersRef.current = result.orders;
      setOrders(result.orders);
      return { ok: true, claimed: result.claimed };
    },
    [customerId]
  );

  /* ---------------------------------------------------------------- */

  const value = useMemo(
    () => ({
      /* State */
      orders: customerOrders,
      currentOrder,
      guestOrderCount,
      /* Reads */
      getOrders,
      getOrderById,
      getCustomerOrders,
      getTracking,
      getReturn,
      /* Writes */
      createOrder,
      /** Phase 8 checkout entry point — the same call as `createOrder`. */
      placeOrder: createOrder,
      clearCurrentOrder,
      updateMockOrderStatus,
      updateMockReturnStatus,
      cancelOrder,
      createReturn,
      claimGuestOrders,
      /* Legacy accessor kept for the account surfaces built in Phase 7. */
      ordersForCustomer: getCustomerOrders,
    }),
    [
      customerOrders,
      currentOrder,
      guestOrderCount,
      getOrders,
      getOrderById,
      getCustomerOrders,
      getTracking,
      getReturn,
      createOrder,
      clearCurrentOrder,
      updateMockOrderStatus,
      updateMockReturnStatus,
      cancelOrder,
      createReturn,
      claimGuestOrders,
    ]
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

/** Inert order state, so a component can render without a provider. */
const inertOrders = {
  orders: [],
  currentOrder: null,
  guestOrderCount: 0,
  getOrders: () => [],
  getOrderById: () => null,
  getCustomerOrders: () => [],
  getTracking: () => null,
  getReturn: () => null,
  createOrder: () => ({ ok: false, order: null, message: "" }),
  placeOrder: () => ({ ok: false, order: null, message: "" }),
  clearCurrentOrder: () => {},
  updateMockOrderStatus: () => ({ ok: false, message: "" }),
  updateMockReturnStatus: () => ({ ok: false, message: "" }),
  cancelOrder: () => ({ ok: false, message: "" }),
  createReturn: () => ({ ok: false, errors: {}, message: "" }),
  claimGuestOrders: () => ({ ok: false, claimed: 0 }),
  ordersForCustomer: () => [],
};

/** Accessor for order state. */
export function useOrder() {
  return useContext(OrderContext) ?? inertOrders;
}

export { ORDER_STATUS };

export default OrderContext;

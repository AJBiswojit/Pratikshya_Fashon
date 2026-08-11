import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ShoppingBag } from "lucide-react";
import AccountShell from "../../components/account/AccountShell";
import { useAuth } from "../../context/AuthContext";
import { useOrder } from "../../context/OrderContext";
import {
  AtelierBadge,
  AtelierButton,
  EmptyState,
} from "../../design-system";
import { formatINR } from "../../utils/shopping";

/**
 * Order history — /account/orders.
 *
 * Lists the demo orders placed from this browser (Phase 8's lightweight
 * order state). Each entry links forward to future order detail; for now
 * the page is a calm record of the orders associated with this customer.
 */
export default function AccountOrders() {
  const { user } = useAuth();
  const { ordersForCustomer } = useOrder();

  useEffect(() => {
    const prevTitle = document.title;
    document.title = "Orders — PRATIKSHYA FASHON";
    return () => {
      document.title = prevTitle;
    };
  }, []);

  const orders = useMemo(
    () => (user?.id ? ordersForCustomer(user.id) : []),
    [user?.id, ordersForCustomer]
  );

  if (orders.length === 0) {
    return (
      <AccountShell
        breadcrumbItems={[
          { label: "Account", to: "/account" },
          { label: "Orders" },
        ]}
      >
        <div className="border border-mist/80 bg-surface/30 p-8 sm:p-14 text-center">
          <EmptyState
            eyebrow="Order History"
            title="YOUR JOURNEY STARTS HERE"
            description="Your orders will appear here once you've made your first purchase. Explore our curated collections of bridal sarees, ceremonial lehengas, and celebratory groom edits."
            actions={
              <div className="flex flex-wrap items-center justify-center gap-4">
                <AtelierButton as={Link} to="/shop" variant="primary" size="md">
                  Explore Collection <ArrowRight size={14} aria-hidden="true" />
                </AtelierButton>
                <AtelierButton as={Link} to="/collections/new-arrivals" variant="outline" size="md">
                  New Arrivals
                </AtelierButton>
              </div>
            }
          />
        </div>
      </AccountShell>
    );
  }

  return (
    <AccountShell
      breadcrumbItems={[
        { label: "Account", to: "/account" },
        { label: "Orders" },
      ]}
    >
      <div className="border border-mist/80 bg-surface/30 p-6 sm:p-10">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="font-ui text-[10px] uppercase tracking-[.3em] text-accent">
              Order History
            </p>
            <h2 className="mt-2 font-display text-3xl font-light tracking-tight text-ink">
              Your <span className="italic text-accent">orders.</span>
            </h2>
          </div>
          <ShoppingBag size={20} strokeWidth={1.5} className="text-taupe" aria-hidden="true" />
        </div>

        <div className="mt-8 border-t border-mist/70">
          {orders.map((order) => {
            const date = new Date(order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
            });
            const quantity = order.items.reduce((total, item) => total + item.quantity, 0);
            return (
              <div
                key={order.id}
                className="flex flex-wrap items-center gap-4 border-b border-mist/70 py-5 sm:gap-6"
              >
                <div className="flex -space-x-3">
                  {order.items.slice(0, 3).map((item, index) => (
                    <img
                      key={`${order.id}-${item.lineId}`}
                      src={item.image}
                      alt=""
                      className="h-14 w-11 border border-canvas bg-surface object-cover"
                      loading="lazy"
                      style={{ zIndex: 3 - index }}
                    />
                  ))}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-display text-base font-light text-ink">{order.id}</p>
                  <p className="mt-0.5 font-ui text-[11px] text-taupe">
                    {date} · {quantity} {quantity === 1 ? "piece" : "pieces"} ·{" "}
                    {order.paymentMethod.label}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <AtelierBadge variant="accent">Confirmed</AtelierBadge>
                  <p className="font-ui text-sm text-ink">{formatINR(order.pricing.total)}</p>
                </div>
              </div>
            );
          })}
        </div>

        <p className="mt-6 font-ui text-[10px] uppercase tracking-[.18em] text-taupe">
          Demonstration orders only — no real transactions are recorded.
        </p>
      </div>
    </AccountShell>
  );
}

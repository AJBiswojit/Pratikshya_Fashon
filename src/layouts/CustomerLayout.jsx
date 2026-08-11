import { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { LoadingState, PageTransition } from "../design-system";
import ScrollToTop from "../components/shell/ScrollToTop";
import { useCart } from "../context/CartContext";
import { useWishlist } from "../context/WishlistContext";
import SiteFooter from "../components/shell/SiteFooter";
import SiteHeader from "../components/shell/SiteHeader";

/**
 * The customer-facing application shell.
 *
 * Header, page, footer — the frame every storefront route is rendered
 * into. The routed page is wrapped in a `PageTransition` keyed on the
 * pathname inside an `AnimatePresence`, so one page fades out before the
 * next fades in.
 *
 * Wishlist and bag counts read the lightweight session state written by the
 * storefront and product detail. Full wishlist and cart destinations remain
 * intentionally deferred to their later phases.
 */

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const wishlist = useWishlist();
  const cart = useCart();
  const counts = { wishlist: wishlist.count, cart: cart.count };

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-display selection:bg-accent selection:text-white">
      <ScrollToTop />
      <SiteHeader counts={counts} />

      <div className="flex-1">
        <AnimatePresence mode="wait" initial={false}>
          <PageTransition key={pathname}>
            <Suspense fallback={<LoadingState label="Loading" />}>
              <Outlet />
            </Suspense>
          </PageTransition>
        </AnimatePresence>
      </div>

      <SiteFooter className={pathname.startsWith("/product/") ? "pb-36 md:pb-16" : ""} />
    </div>
  );
}

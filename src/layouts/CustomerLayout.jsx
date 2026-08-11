import { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { LoadingState, PageTransition } from "../design-system";
import ScrollToTop from "../components/shell/ScrollToTop";
import { useWishlist } from "../context/WishlistContext";
import SiteFooter from "../components/shell/SiteFooter";
import SiteHeader from "../components/shell/SiteHeader";
import { products } from "../data/pratikshyaMockData";

/**
 * The customer-facing application shell.
 *
 * Header, page, footer — the frame every storefront route is rendered
 * into. The routed page is wrapped in a `PageTransition` keyed on the
 * pathname inside an `AnimatePresence`, so one page fades out before the
 * next fades in.
 *
 * The wishlist count is real — it reads the session wishlist the storefront
 * writes to. The bag is still a placeholder; the cart belongs to a later
 * phase and the shell only needs somewhere for that number to live.
 */

const placeholderCart = Math.min(products.length, 2);

export default function CustomerLayout() {
  const { pathname } = useLocation();
  const wishlist = useWishlist();
  const counts = { wishlist: wishlist.count, cart: placeholderCart };

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

      <SiteFooter />
    </div>
  );
}

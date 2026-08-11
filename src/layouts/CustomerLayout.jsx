import { Suspense } from "react";
import { AnimatePresence } from "framer-motion";
import { Outlet, useLocation } from "react-router-dom";
import { LoadingState, PageTransition } from "../design-system";
import ScrollToTop from "../components/shell/ScrollToTop";
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
 * The counts passed to the header are placeholders drawn from the existing
 * mock data. Real cart and wishlist state belongs to a later phase; the
 * shell only needs somewhere for those numbers to live.
 */

const placeholderCounts = {
  wishlist: 3,
  cart: Math.min(products.length, 2),
};

export default function CustomerLayout() {
  const { pathname } = useLocation();

  return (
    <div className="min-h-screen flex flex-col bg-canvas text-ink font-display selection:bg-accent selection:text-white">
      <ScrollToTop />
      <SiteHeader counts={placeholderCounts} />

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

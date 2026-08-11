import { lazy } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { routeManifest } from "./config/navigationConfig";
import { hasNavigationScope } from "./data/products/taxonomy";
import { CartProvider } from "./context/CartContext";
import { WishlistProvider } from "./context/WishlistContext";
import CustomerLayout from "./layouts/CustomerLayout";
import AtelierDesign from "./pages/AtelierDesign";
import CatalogueListing from "./pages/CatalogueListing";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Shop from "./pages/Shop";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));

/**
 * Routing.
 *
 * Every customer-facing route is nested inside `CustomerLayout`, so the
 * header, footer and page transition are declared once. The landing page
 * keeps the index route and its own full-bleed composition; the shell simply
 * frames it.
 *
 * Interior routes come from two places:
 *
 *   — the storefront's own paths (`/shop`, `/category/:slug`,
 *     `/collection/:slug`, `/search`, `/product/:slug`);
 *   — the route manifest in `src/config/navigationConfig.js`, the same
 *     source the navigation, mega menu, drawer and breadcrumbs read from, so
 *     a destination can never appear in the menu without resolving.
 *
 * A manifest path that maps to a catalogue scope renders the storefront;
 * the rest keep the generic interior page. That is what lets the Phase 3
 * navigation lead to real inventory without inventing a parallel set of URLs.
 */
export default function App() {
  return (
    <BrowserRouter>
      <WishlistProvider>
        <CartProvider>
          <Routes>
            <Route element={<CustomerLayout />}>
              <Route index element={<AtelierDesign />} />

              {/* Storefront */}
              <Route path="/shop" element={<Shop />} />
              <Route path="/category/:slug" element={<CatalogueListing variant="category" />} />
              <Route path="/collection/:slug" element={<CatalogueListing variant="collection" />} />
              <Route path="/search" element={<SearchResults />} />
              <Route path="/product/:productId" element={<ProductDetail />} />

              {/* Navigation manifest */}
              {routeManifest
                .filter((route) => route.path !== "/search")
                .map((route) => (
                  <Route
                    key={route.path}
                    path={route.path}
                    element={
                      hasNavigationScope(route.path) ? (
                        <CatalogueListing variant="navigation" />
                      ) : (
                        <CategoryPage />
                      )
                    }
                  />
                ))}

              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </CartProvider>
      </WishlistProvider>
    </BrowserRouter>
  );
}

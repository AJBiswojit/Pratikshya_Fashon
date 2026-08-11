import { lazy } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { routeManifest } from "./config/navigationConfig";
import { hasNavigationScope } from "./data/products/taxonomy";
import { AuthProvider } from "./context/AuthContext";
import { AccountProvider } from "./context/AccountContext";
import { ShoppingProvider } from "./context/ShoppingContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import { OrderProvider } from "./context/OrderContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import CustomerLayout from "./layouts/CustomerLayout";
import AtelierDesign from "./pages/AtelierDesign";
import CatalogueListing from "./pages/CatalogueListing";
import CategoryPage from "./pages/CategoryPage";
import NotFound from "./pages/NotFound";
import SearchResults from "./pages/SearchResults";
import Shop from "./pages/Shop";

const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Cart = lazy(() => import("./pages/Cart"));
const Wishlist = lazy(() => import("./pages/Wishlist"));
const Checkout = lazy(() => import("./pages/Checkout"));
const OrderSuccess = lazy(() => import("./pages/OrderSuccess"));

/* Authentication Pages */
const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

/* Customer Account Pages */
const AccountDashboard = lazy(() => import("./pages/account/AccountDashboard"));
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const OrderTracking = lazy(() => import("./pages/account/OrderTracking"));
const OrderReturn = lazy(() => import("./pages/account/OrderReturn"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const AccountSecurity = lazy(() => import("./pages/account/AccountSecurity"));

/** Paths owned by dedicated pages rather than the generic interior shell. */
const dedicatedPaths = new Set([
  "/search",
  "/cart",
  "/wishlist",
  "/checkout",
  "/order-success",
  "/account",
  "/account/profile",
  "/account/addresses",
  "/account/orders",
  "/account/settings",
  "/account/security",
  "/account/wishlist",
  "/signin",
  "/signup",
  "/forgot-password",
  "/reset-password",
]);

/**
 * Routing.
 *
 * Every customer-facing route is nested inside `CustomerLayout`, so the
 * header, footer and page transition are declared once.
 *
 * Providers compose clean state boundaries:
 * AuthProvider (Identity & Session)
 * └── AccountProvider (Profile, Addresses & Preferences)
 *     └── ShoppingProvider (Bag & Wishlist)
 *         └── OrderProvider (Mock order records)
 *             └── CheckoutProvider (Current checkout session)
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <ShoppingProvider>
            <OrderProvider>
              <CheckoutProvider>
                <Routes>
              <Route element={<CustomerLayout />}>
                <Route index element={<AtelierDesign />} />

                {/* Storefront */}
                <Route path="/shop" element={<Shop />} />
                <Route path="/category/:slug" element={<CatalogueListing variant="category" />} />
                <Route path="/collection/:slug" element={<CatalogueListing variant="collection" />} />
                <Route path="/search" element={<SearchResults />} />
                <Route path="/product/:productId" element={<ProductDetail />} />

                {/* Shopping */}
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-success" element={<OrderSuccess />} />
                <Route path="/account/wishlist" element={<Wishlist />} />
                <Route path="/wishlist" element={<Navigate to="/account/wishlist" replace />} />

                {/* Authentication */}
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                <Route path="/forgot-password" element={<ForgotPassword />} />
                <Route path="/reset-password" element={<ResetPassword />} />

                {/*
                  Single-order routes. Not wrapped in ProtectedRoute: a guest
                  who has just checked out must still reach the order they
                  placed in this browser. Access is enforced on the order
                  itself — the context only resolves orders the current
                  identity owns, so another customer's order is never exposed.
                */}
                <Route path="/account/orders/:orderId" element={<OrderDetail />} />
                <Route
                  path="/account/orders/:orderId/track"
                  element={<OrderTracking />}
                />
                <Route
                  path="/account/orders/:orderId/return"
                  element={<OrderReturn />}
                />

                {/* Protected Customer Account */}
                <Route element={<ProtectedRoute />}>
                  <Route path="/account" element={<AccountDashboard />} />
                  <Route path="/account/profile" element={<AccountProfile />} />
                  <Route path="/account/addresses" element={<AccountAddresses />} />
                  <Route path="/account/orders" element={<AccountOrders />} />
                  <Route path="/account/settings" element={<AccountSettings />} />
                  <Route path="/account/security" element={<AccountSecurity />} />
                </Route>

                {/* Navigation manifest interior routes */}
                {routeManifest
                  .filter((route) => !dedicatedPaths.has(route.path))
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
              </CheckoutProvider>
            </OrderProvider>
          </ShoppingProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

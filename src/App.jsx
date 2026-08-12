import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoadingState } from "./design-system";
import { routeManifest } from "./config/navigationConfig";
import { hasNavigationScope } from "./data/products/taxonomy";
import { AuthProvider } from "./context/AuthContext";
import { AccountProvider } from "./context/AccountContext";
import { ShoppingProvider } from "./context/ShoppingContext";
import { CheckoutProvider } from "./context/CheckoutContext";
import { OrderProvider } from "./context/OrderContext";
import { EmployeeAuthProvider } from "./context/EmployeeAuthContext";
import { EmployeeManagementProvider } from "./context/EmployeeManagementContext";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import EmployeeProtectedRoute from "./components/employee/EmployeeProtectedRoute";
import AdminProtectedRoute from "./components/admin/AdminProtectedRoute";
import CustomerLayout from "./layouts/CustomerLayout";
import EmployeeLayout from "./layouts/EmployeeLayout";
import AdminLayout from "./layouts/AdminLayout";
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

/* Employee Portal */
const EmployeeLogin = lazy(() => import("./pages/employee/EmployeeLogin"));
const EmployeeForgotPassword = lazy(() => import("./pages/employee/EmployeeForgotPassword"));
const EmployeeChangePassword = lazy(() => import("./pages/employee/EmployeeChangePassword"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeProfile = lazy(() => import("./pages/employee/EmployeeProfile"));
const EmployeeAttendance = lazy(() => import("./pages/employee/EmployeeAttendance"));
const EmployeePerformance = lazy(() => import("./pages/employee/EmployeePerformance"));
const EmployeeProducts = lazy(() => import("./pages/employee/EmployeeProducts"));
const EmployeeCustomers = lazy(() => import("./pages/employee/EmployeeCustomers"));
const EmployeeOrders = lazy(() => import("./pages/employee/EmployeeOrders"));
const EmployeeAssistedOrder = lazy(() => import("./pages/employee/EmployeeAssistedOrder"));
const EmployeeOffers = lazy(() => import("./pages/employee/EmployeeOffers"));
const EmployeeAccessDenied = lazy(() => import("./pages/employee/EmployeeAccessDenied"));
const EmployeeDesk = lazy(() => import("./pages/employee/EmployeeDesk"));
const EmployeeList = lazy(() => import("./pages/employee/management/EmployeeList"));
const EmployeeCreate = lazy(() => import("./pages/employee/management/EmployeeCreate"));
const EmployeeDetail = lazy(() => import("./pages/employee/management/EmployeeDetail"));
const EmployeeEdit = lazy(() => import("./pages/employee/management/EmployeeEdit"));
const ActivityLog = lazy(() => import("./pages/employee/management/ActivityLog"));

/* Admin Portal */
const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("./pages/admin/AdminDashboard"));
const AdminEmployeeList = lazy(() => import("./pages/admin/employees/AdminEmployeeList"));
const AdminEmployeeCreate = lazy(() => import("./pages/admin/employees/AdminEmployeeCreate"));
const AdminEmployeeDetail = lazy(() => import("./pages/admin/employees/AdminEmployeeDetail"));
const AdminEmployeeEdit = lazy(() => import("./pages/admin/employees/AdminEmployeeEdit"));
const AdminRoles = lazy(() => import("./pages/admin/AdminRoles"));
const AdminRoleDetail = lazy(() => import("./pages/admin/AdminRoleDetail"));
const AdminActivity = lazy(() => import("./pages/admin/AdminActivity"));
const AdminProfile = lazy(() => import("./pages/admin/AdminProfile"));
const AdminModulePlaceholder = lazy(() => import("./pages/admin/AdminModulePlaceholder"));
const AdminProducts = lazy(() => import("./pages/admin/AdminProducts"));
const ProductForm = lazy(() => import("./pages/admin/ProductForm"));
const AdminProductDetail = lazy(() => import("./pages/admin/AdminProductDetail"));
const AdminMediaLibrary = lazy(() => import("./pages/admin/media/AdminMediaLibrary"));
const AdminMarketingMedia = lazy(() => import("./pages/admin/media/AdminMarketingMedia"));
const AdminMediaDetail = lazy(() => import("./pages/admin/media/AdminMediaDetail"));
const AdminProductMedia = lazy(() => import("./pages/admin/media/AdminProductMedia"));
const AdminNotFound = lazy(() => import("./pages/admin/AdminNotFound"));

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
 * Customer storefront stays inside `CustomerLayout`.
 * Employee portal is a sibling tree — its own shell, its own auth.
 *
 * Providers:
 * AuthProvider (customer)
 * └── AccountProvider
 *     └── ShoppingProvider
 *         └── OrderProvider
 *             └── CheckoutProvider
 *                 └── EmployeeAuthProvider
 *                     └── EmployeeManagementProvider
 *                         └── AdminAuthProvider
 *
 * The three authentication boundaries are siblings, never nested in
 * meaning: customer, employee and admin each own their own storage key and
 * their own guard. EmployeeManagementProvider sits above AdminAuthProvider
 * only so both portals administer one shared employee register.
 */
export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <ShoppingProvider>
            <OrderProvider>
              <CheckoutProvider>
                <EmployeeAuthProvider>
                  <EmployeeManagementProvider>
                    <AdminAuthProvider>
                    <Suspense fallback={<LoadingState label="Opening PRATIKSHYA FASHON" />}>
                    <Routes>
                      {/*
                        Admin Portal — its own door, its own session, its own shell.
                        It consumes EmployeeManagementContext for people administration
                        so both portals write to one employee register.
                      */}
                      <Route path="/admin/login" element={<AdminLogin />} />

                      <Route element={<AdminProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

                          {/* People — live in this phase */}
                          <Route path="/admin/employees" element={<AdminEmployeeList />} />
                          <Route path="/admin/employees/new" element={<AdminEmployeeCreate />} />
                          <Route path="/admin/employees/:employeeId" element={<AdminEmployeeDetail />} />
                          <Route path="/admin/employees/:employeeId/edit" element={<AdminEmployeeEdit />} />
                          <Route path="/admin/roles" element={<AdminRoles />} />
                          <Route path="/admin/roles/:roleId" element={<AdminRoleDetail />} />
                          <Route path="/admin/activity" element={<AdminActivity />} />
                          <Route path="/admin/profile" element={<AdminProfile />} />

                          {/* Business modules — navigable placeholders until their phase lands */}
                          <Route path="/admin/products" element={<AdminProducts />} />
                          <Route path="/admin/products/new" element={<ProductForm />} />
                          <Route path="/admin/products/:productId/edit" element={<ProductForm />} />
                          <Route path="/admin/products/:productId" element={<AdminProductDetail />} />
                          <Route path="/admin/products/:productId/media" element={<AdminProductMedia />} />

                          {/* Media. The marketing board is declared before the
                              record route so /admin/media/marketing is never
                              read as a media identifier. */}
                          <Route path="/admin/media" element={<AdminMediaLibrary />} />
                          <Route path="/admin/media/marketing" element={<AdminMarketingMedia />} />
                          <Route path="/admin/media/:mediaId" element={<AdminMediaDetail />} />
                          <Route path="/admin/categories" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/collections" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/offers" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/orders" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/customers" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/returns" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/inventory" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/warehouses" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/stock-movements" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/attendance" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/performance" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/analytics/sales" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/analytics/products" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/analytics/customers" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/analytics/inventory" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/settings" element={<AdminModulePlaceholder />} />

                          <Route path="/admin/*" element={<AdminNotFound />} />
                        </Route>
                      </Route>

                      {/*
                        Employee portal — never rendered through customer auth or shell.
                      */}
                      <Route path="/employee/login" element={<EmployeeLogin />} />
                      <Route path="/employee/forgot-password" element={<EmployeeForgotPassword />} />

                      <Route element={<EmployeeProtectedRoute />}>
                        <Route path="/employee/change-password" element={<EmployeeChangePassword />} />
                        <Route element={<EmployeeLayout />}>
                          <Route path="/employee" element={<EmployeeDashboard />} />
                          <Route path="/employee/profile" element={<EmployeeProfile />} />
                          <Route path="/employee/attendance" element={<EmployeeAttendance />} />
                          <Route path="/employee/performance" element={<EmployeePerformance />} />
                          <Route path="/employee/access-denied" element={<EmployeeAccessDenied />} />
                          <Route path="/employee/products" element={<EmployeeProducts />} />
                          <Route path="/employee/customers" element={<EmployeeCustomers />} />
                          <Route path="/employee/orders" element={<EmployeeOrders />} />
                          <Route path="/employee/orders/assisted" element={<EmployeeAssistedOrder />} />
                          <Route path="/employee/offers" element={<EmployeeOffers />} />
                          <Route path="/employee/inventory" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/movements" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/transfers" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/low-stock" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/out-of-stock" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/receive" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/adjust" element={<EmployeeDesk />} />
                          <Route path="/employee/inventory/requests" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse/incoming" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse/outgoing" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse/pick-pack" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse/transfers" element={<EmployeeDesk />} />
                          <Route path="/employee/warehouse/damaged" element={<EmployeeDesk />} />
                          <Route path="/employee/returns" element={<EmployeeDesk />} />
                          <Route path="/employee/support" element={<EmployeeDesk />} />
                          <Route path="/employee/support/cases" element={<EmployeeDesk />} />
                          <Route path="/employee/support/returns" element={<EmployeeDesk />} />
                          <Route path="/employee/support/feedback" element={<EmployeeDesk />} />
                          <Route path="/employee/styling" element={<EmployeeDesk />} />
                          <Route path="/employee/styling/requests" element={<EmployeeDesk />} />
                          <Route path="/employee/styling/appointments" element={<EmployeeDesk />} />
                          <Route path="/employee/styling/recommendations" element={<EmployeeDesk />} />
                          <Route path="/employee/styling/bridal" element={<EmployeeDesk />} />
                          <Route path="/employee/styling/wedding" element={<EmployeeDesk />} />
                          <Route path="/employee/sales" element={<EmployeeDesk />} />
                          <Route path="/employee/team" element={<EmployeeDesk />} />
                          <Route path="/employee/reports" element={<EmployeeDesk />} />
                          <Route path="/employee/management" element={<EmployeeList />} />
                          <Route path="/employee/management/new" element={<EmployeeCreate />} />
                          <Route path="/employee/management/activity" element={<ActivityLog />} />
                          <Route path="/employee/management/:employeeId" element={<EmployeeDetail />} />
                          <Route path="/employee/management/:employeeId/edit" element={<EmployeeEdit />} />
                        </Route>
                      </Route>

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
                    </Suspense>
                    </AdminAuthProvider>
                  </EmployeeManagementProvider>
                </EmployeeAuthProvider>
              </CheckoutProvider>
            </OrderProvider>
          </ShoppingProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

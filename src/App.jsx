import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { LoadingState } from "./design-system";
import { routeManifest } from "./config/navigationConfig";
import { hasNavigationScope } from "./data/products/taxonomy";
import { AuthProvider } from "./context/AuthContext";
import { AccountProvider } from "./context/AccountContext";
import { ShoppingProvider } from "./context/ShoppingContext";
import { InventoryProvider } from "./context/InventoryContext";
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

const SignIn = lazy(() => import("./pages/auth/SignIn"));
const SignUp = lazy(() => import("./pages/auth/SignUp"));
const ForgotPassword = lazy(() => import("./pages/auth/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/auth/ResetPassword"));

const AccountDashboard = lazy(() => import("./pages/account/AccountDashboard"));
const AccountProfile = lazy(() => import("./pages/account/AccountProfile"));
const AccountAddresses = lazy(() => import("./pages/account/AccountAddresses"));
const AccountOrders = lazy(() => import("./pages/account/AccountOrders"));
const OrderDetail = lazy(() => import("./pages/account/OrderDetail"));
const OrderTracking = lazy(() => import("./pages/account/OrderTracking"));
const OrderReturn = lazy(() => import("./pages/account/OrderReturn"));
const AccountSettings = lazy(() => import("./pages/account/AccountSettings"));
const AccountSecurity = lazy(() => import("./pages/account/AccountSecurity"));

const EmployeeLogin = lazy(() => import("./pages/employee/EmployeeLogin"));
const EmployeeForgotPassword = lazy(() => import("./pages/employee/EmployeeForgotPassword"));
const EmployeeChangePassword = lazy(() => import("./pages/employee/EmployeeChangePassword"));
const EmployeeDashboard = lazy(() => import("./pages/employee/EmployeeDashboard"));
const EmployeeProfile = lazy(() => import("./pages/employee/EmployeeProfile"));
const EmployeeAttendance = lazy(() => import("./pages/employee/EmployeeAttendance"));
const EmployeePerformance = lazy(() => import("./pages/employee/EmployeePerformance"));
const EmployeeProducts = lazy(() => import("./pages/employee/EmployeeProducts"));
const EmployeeProductForm = lazy(() => import("./pages/employee/EmployeeProductForm"));
const EmployeeCustomers = lazy(() => import("./pages/employee/EmployeeCustomers"));
const EmployeeOrders = lazy(() => import("./pages/employee/EmployeeOrders"));
const EmployeeOrderDetail = lazy(() => import("./pages/employee/EmployeeOrderDetail"));
const EmployeeAssistedOrder = lazy(() => import("./pages/employee/EmployeeAssistedOrder"));
const EmployeeOffers = lazy(() => import("./pages/employee/EmployeeOffers"));
const EmployeeAccessDenied = lazy(() => import("./pages/employee/EmployeeAccessDenied"));
const EmployeeDesk = lazy(() => import("./pages/employee/EmployeeDesk"));
const EmployeeMediaDashboard = lazy(() => import("./pages/employee/EmployeeMediaDashboard"));
const EmployeeMediaUpload = lazy(() => import("./pages/employee/EmployeeMediaUpload"));
const EmployeeMediaDetail = lazy(() => import("./pages/employee/EmployeeMediaDetail"));
const EmployeeList = lazy(() => import("./pages/employee/management/EmployeeList"));
const EmployeeCreate = lazy(() => import("./pages/employee/management/EmployeeCreate"));
const EmployeeDetail = lazy(() => import("./pages/employee/management/EmployeeDetail"));
const EmployeeEdit = lazy(() => import("./pages/employee/management/EmployeeEdit"));
const ActivityLog = lazy(() => import("./pages/employee/management/ActivityLog"));

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
const AdminProductReview = lazy(() => import("./pages/admin/AdminProductReview"));
const AdminMediaLibrary = lazy(() => import("./pages/admin/media/AdminMediaLibrary"));
const AdminMediaUpload = lazy(() => import("./pages/admin/media/AdminMediaUpload"));
const AdminMediaReview = lazy(() => import("./pages/admin/media/AdminMediaReview"));
const AdminMarketingMedia = lazy(() => import("./pages/admin/media/AdminMarketingMedia"));
const AdminMediaDetail = lazy(() => import("./pages/admin/media/AdminMediaDetail"));
const AdminProductMedia = lazy(() => import("./pages/admin/media/AdminProductMedia"));
const InventoryDashboardPage = lazy(() => import("./components/inventory/InventoryDashboardPage"));
const InventoryOperationPage = lazy(() => import("./components/inventory/InventoryOperationPage"));
const InventoryTransfersPage = lazy(() => import("./components/inventory/InventoryTransfersPage"));
const InventoryMovementsPage = lazy(() => import("./components/inventory/InventoryMovementsPage"));
const InventoryLowStockPage = lazy(() => import("./components/inventory/InventoryLowStockPage"));
const AdminOrders = lazy(() => import("./pages/admin/orders/AdminOrders"));
const AdminOrderDetail = lazy(() => import("./pages/admin/orders/AdminOrderDetail"));
const AdminOrderInvoice = lazy(() => import("./pages/admin/orders/AdminOrderInvoice"));
const AdminNotFound = lazy(() => import("./pages/admin/AdminNotFound"));
const AdminCustomers = lazy(() => import("./pages/admin/AdminCustomers"));
const AdminCustomerDetail = lazy(() => import("./pages/admin/AdminCustomerDetail"));
const AdminReturns = lazy(() => import("./pages/admin/AdminReturns"));
const AdminReturnDetail = lazy(() => import("./pages/admin/AdminReturnDetail"));

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

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AccountProvider>
          <InventoryProvider>
            <ShoppingProvider>
              <OrderProvider>
                <CheckoutProvider>
                  <EmployeeAuthProvider>
                  <EmployeeManagementProvider>
                    <AdminAuthProvider>
                    <Suspense fallback={<LoadingState label="Opening PRATIKSHYA FASHON" />}>
                    <Routes>
                      <Route path="/admin/login" element={<AdminLogin />} />

                      <Route element={<AdminProtectedRoute />}>
                        <Route element={<AdminLayout />}>
                          <Route path="/admin" element={<AdminDashboard />} />
                          <Route path="/admin/dashboard" element={<Navigate to="/admin" replace />} />

                          <Route path="/admin/employees" element={<AdminEmployeeList />} />
                          <Route path="/admin/employees/new" element={<AdminEmployeeCreate />} />
                          <Route path="/admin/employees/:employeeId" element={<AdminEmployeeDetail />} />
                          <Route path="/admin/employees/:employeeId/edit" element={<AdminEmployeeEdit />} />
                          <Route path="/admin/roles" element={<AdminRoles />} />
                          <Route path="/admin/roles/:roleId" element={<AdminRoleDetail />} />
                          <Route path="/admin/activity" element={<AdminActivity />} />
                          <Route path="/admin/profile" element={<AdminProfile />} />

                          <Route path="/admin/products" element={<AdminProducts />} />
                          <Route path="/admin/products/review" element={<AdminProductReview />} />
                          <Route path="/admin/products/new" element={<ProductForm />} />
                          <Route path="/admin/products/:productId/edit" element={<ProductForm />} />
                          <Route path="/admin/products/:productId" element={<AdminProductDetail />} />
                          <Route path="/admin/products/:productId/media" element={<AdminProductMedia />} />

                          <Route path="/admin/media" element={<AdminMediaLibrary />} />
                          <Route path="/admin/media/upload" element={<AdminMediaUpload />} />
                          <Route path="/admin/media/review" element={<AdminMediaReview />} />
                          <Route path="/admin/media/marketing" element={<AdminMarketingMedia />} />
                          <Route path="/admin/media/:mediaId" element={<AdminMediaDetail />} />
                          <Route path="/admin/categories" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/collections" element={<AdminModulePlaceholder />} />
                          <Route path="/admin/offers" element={<AdminModulePlaceholder />} />
                          {/* Phase 15 — Orders become operational */}
                          <Route path="/admin/orders" element={<AdminOrders />} />
                          <Route path="/admin/orders/:orderId" element={<AdminOrderDetail />} />
                          <Route path="/admin/orders/:orderId/invoice" element={<AdminOrderInvoice />} />
                          <Route path="/admin/customers" element={<AdminCustomers />} />
                          <Route path="/admin/customers/:customerId" element={<AdminCustomerDetail />} />
                          <Route path="/admin/returns" element={<AdminReturns />} />
                          <Route path="/admin/returns/:returnId" element={<AdminReturnDetail />} />
                          <Route path="/admin/inventory" element={<InventoryDashboardPage portal="admin" />} />
                          <Route path="/admin/inventory/receive" element={<InventoryOperationPage portal="admin" operation="receive" />} />
                          <Route path="/admin/inventory/adjust" element={<InventoryOperationPage portal="admin" operation="adjust" />} />
                          <Route path="/admin/inventory/transfers" element={<InventoryTransfersPage portal="admin" />} />
                          <Route path="/admin/inventory/movements" element={<InventoryMovementsPage portal="admin" />} />
                          <Route path="/admin/inventory/low-stock" element={<InventoryLowStockPage portal="admin" />} />
                          <Route path="/admin/warehouses" element={<Navigate to="/admin/inventory?locationType=WAREHOUSE" replace />} />
                          <Route path="/admin/stock-movements" element={<Navigate to="/admin/inventory/movements" replace />} />
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
                          <Route path="/employee/media" element={<EmployeeMediaDashboard />} />
                          <Route path="/employee/media/upload" element={<EmployeeMediaUpload />} />
                          <Route path="/employee/media/:mediaId" element={<EmployeeMediaDetail />} />
                          <Route path="/employee/products" element={<EmployeeProducts />} />
                          <Route path="/employee/products/new" element={<EmployeeProductForm />} />
                          <Route path="/employee/products/:productId/edit" element={<EmployeeProductForm />} />
                          <Route path="/employee/customers" element={<EmployeeCustomers />} />
                          <Route path="/employee/orders" element={<EmployeeOrders />} />
                          <Route path="/employee/orders/:orderId" element={<EmployeeOrderDetail />} />
                          <Route path="/employee/orders/assisted" element={<EmployeeAssistedOrder />} />
                          <Route path="/employee/offers" element={<EmployeeOffers />} />
                          <Route path="/employee/inventory" element={<InventoryDashboardPage portal="employee" />} />
                          <Route path="/employee/inventory/movements" element={<InventoryMovementsPage portal="employee" />} />
                          <Route path="/employee/inventory/transfers" element={<InventoryTransfersPage portal="employee" />} />
                          <Route path="/employee/inventory/low-stock" element={<InventoryLowStockPage portal="employee" />} />
                          <Route path="/employee/inventory/out-of-stock" element={<Navigate to="/employee/inventory/low-stock" replace />} />
                          <Route path="/employee/inventory/receive" element={<InventoryOperationPage portal="employee" operation="receive" />} />
                          <Route path="/employee/inventory/adjust" element={<InventoryOperationPage portal="employee" operation="adjust" />} />
                          <Route path="/employee/inventory/requests" element={<Navigate to="/employee/inventory/transfers" replace />} />
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

                        <Route path="/shop" element={<Shop />} />
                        <Route path="/category/:slug" element={<CatalogueListing variant="category" />} />
                        <Route path="/collection/:slug" element={<CatalogueListing variant="collection" />} />
                        <Route path="/search" element={<SearchResults />} />
                        <Route path="/product/:productId" element={<ProductDetail />} />

                        <Route path="/cart" element={<Cart />} />
                        <Route path="/checkout" element={<Checkout />} />
                        <Route path="/order-success" element={<OrderSuccess />} />
                        <Route path="/account/wishlist" element={<Wishlist />} />
                        <Route path="/wishlist" element={<Navigate to="/account/wishlist" replace />} />

                        <Route path="/signin" element={<SignIn />} />
                        <Route path="/signup" element={<SignUp />} />
                        <Route path="/forgot-password" element={<ForgotPassword />} />
                        <Route path="/reset-password" element={<ResetPassword />} />

                        <Route path="/account/orders/:orderId" element={<OrderDetail />} />
                        <Route path="/account/orders/:orderId/track" element={<OrderTracking />} />
                        <Route path="/account/orders/:orderId/return" element={<OrderReturn />} />

                        <Route element={<ProtectedRoute />}>
                          <Route path="/account" element={<AccountDashboard />} />
                          <Route path="/account/profile" element={<AccountProfile />} />
                          <Route path="/account/addresses" element={<AccountAddresses />} />
                          <Route path="/account/orders" element={<AccountOrders />} />
                          <Route path="/account/settings" element={<AccountSettings />} />
                          <Route path="/account/security" element={<AccountSecurity />} />
                        </Route>

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
          </InventoryProvider>
        </AccountProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

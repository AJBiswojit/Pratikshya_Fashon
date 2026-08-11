/**
 * PRATIKSHYA FASHON — Employee navigation & route authorization.
 *
 * Navigation items are filtered by permission. Route authorization uses
 * the same map so hiding a link is never the only protection.
 */

import { PERMISSIONS as P } from "./employeePermissions";

export const EMPLOYEE_BRAND = {
  name: "PRATIKSHYA FASHON",
  portal: "Employee Portal",
  subtitle: "Retail Operations",
  home: "/employee",
  login: "/employee/login",
};

/**
 * Longest-prefix route rules. `/employee` is exact-only so it does not
 * swallow every nested path.
 */
export const EMPLOYEE_ROUTE_RULES = [
  { path: "/employee/management", permission: P.EMPLOYEES_MANAGE, prefix: true },
  { path: "/employee/team", permission: P.TEAM_VIEW, prefix: true },
  { path: "/employee/reports", permission: P.ANALYTICS_VIEW, prefix: true },
  { path: "/employee/sales", permission: P.ANALYTICS_VIEW, prefix: true },
  { path: "/employee/products", permission: P.PRODUCTS_VIEW, prefix: true },
  { path: "/employee/customers", permission: P.CUSTOMERS_VIEW, prefix: true },
  { path: "/employee/orders/assisted", permission: P.ORDERS_CREATE, prefix: true },
  { path: "/employee/orders", permission: P.ORDERS_VIEW, prefix: true },
  { path: "/employee/offers", permission: P.OFFERS_VIEW, prefix: true },
  { path: "/employee/inventory", permission: P.INVENTORY_VIEW, prefix: true },
  { path: "/employee/warehouse", permission: P.WAREHOUSE_VIEW, prefix: true },
  { path: "/employee/returns", permission: P.RETURNS_VIEW, prefix: true },
  { path: "/employee/support", permission: P.SUPPORT_VIEW, prefix: true },
  { path: "/employee/styling", permission: P.STYLING_VIEW, prefix: true },
  { path: "/employee/attendance", permission: P.ATTENDANCE_VIEW, prefix: true },
  { path: "/employee/performance", permission: P.PERFORMANCE_VIEW, prefix: true },
  { path: "/employee/profile", permission: P.PROFILE_VIEW, prefix: true },
  { path: "/employee/access-denied", permission: null, prefix: true },
  { path: "/employee", permission: P.DASHBOARD_VIEW, prefix: false },
];

export const requiredPermissionForPath = (pathname) => {
  if (!pathname || typeof pathname !== "string") return P.DASHBOARD_VIEW;
  const cleaned = pathname.split("?")[0];
  const match = EMPLOYEE_ROUTE_RULES.find((rule) =>
    rule.prefix ? cleaned === rule.path || cleaned.startsWith(`${rule.path}/`) : cleaned === rule.path
  );
  return match ? match.permission : P.DASHBOARD_VIEW;
};

/**
 * Full navigation catalogue. Items the signed-in employee cannot access
 * are omitted — never rendered and then hidden.
 */
export const EMPLOYEE_NAV_ITEMS = [
  { id: "dashboard", label: "Dashboard", to: "/employee", icon: "layout", permission: P.DASHBOARD_VIEW, exact: true },
  { id: "products", label: "Products", to: "/employee/products", icon: "sparkles", permission: P.PRODUCTS_VIEW },
  { id: "customers", label: "Customers", to: "/employee/customers", icon: "users", permission: P.CUSTOMERS_VIEW },
  { id: "orders", label: "Orders", to: "/employee/orders", icon: "bag", permission: P.ORDERS_VIEW },
  { id: "assisted", label: "Assisted order", to: "/employee/orders/assisted", icon: "plus", permission: P.ORDERS_CREATE },
  { id: "offers", label: "Offers", to: "/employee/offers", icon: "tag", permission: P.OFFERS_VIEW },
  { id: "inventory", label: "Inventory", to: "/employee/inventory", icon: "boxes", permission: P.INVENTORY_VIEW },
  { id: "movements", label: "Stock movements", to: "/employee/inventory/movements", icon: "swap", permission: P.INVENTORY_VIEW },
  { id: "transfers", label: "Transfers", to: "/employee/inventory/transfers", icon: "truck", permission: P.INVENTORY_TRANSFER },
  { id: "low-stock", label: "Low stock", to: "/employee/inventory/low-stock", icon: "alert", permission: P.INVENTORY_VIEW },
  { id: "receive", label: "Receive", to: "/employee/inventory/receive", icon: "inbox", permission: P.INVENTORY_RECEIVE },
  { id: "adjust", label: "Adjust", to: "/employee/inventory/adjust", icon: "sliders", permission: P.INVENTORY_ADJUST },
  { id: "warehouse", label: "Warehouse", to: "/employee/warehouse", icon: "warehouse", permission: P.WAREHOUSE_VIEW },
  { id: "pick-pack", label: "Pick & pack", to: "/employee/warehouse/pick-pack", icon: "package", permission: P.WAREHOUSE_PICK },
  { id: "returns", label: "Returns", to: "/employee/returns", icon: "undo", permission: P.RETURNS_VIEW },
  { id: "support", label: "Support", to: "/employee/support", icon: "headset", permission: P.SUPPORT_VIEW },
  { id: "styling", label: "Styling", to: "/employee/styling", icon: "wand", permission: P.STYLING_VIEW },
  { id: "appointments", label: "Appointments", to: "/employee/styling/appointments", icon: "calendar", permission: P.STYLING_VIEW },
  { id: "bridal", label: "Bridal desk", to: "/employee/styling/bridal", icon: "gem", permission: P.STYLING_VIEW },
  { id: "sales", label: "Sales", to: "/employee/sales", icon: "trend", permission: P.ANALYTICS_VIEW },
  { id: "team", label: "Team", to: "/employee/team", icon: "team", permission: P.TEAM_VIEW },
  { id: "reports", label: "Reports", to: "/employee/reports", icon: "chart", permission: P.ANALYTICS_VIEW },
  { id: "people", label: "Employees", to: "/employee/management", icon: "badge", permission: P.EMPLOYEES_MANAGE },
  { id: "performance", label: "Performance", to: "/employee/performance", icon: "target", permission: P.PERFORMANCE_VIEW },
  { id: "attendance", label: "Attendance", to: "/employee/attendance", icon: "clock", permission: P.ATTENDANCE_VIEW },
  { id: "profile", label: "Profile", to: "/employee/profile", icon: "user", permission: P.PROFILE_VIEW },
];

/**
 * Preferred order for each role so the sidebar reads like that role's
 * working day — not one giant list with most items missing.
 */
export const ROLE_NAV_SEQUENCE = {
  SUPER_ADMIN: [
    "dashboard",
    "people",
    "team",
    "sales",
    "orders",
    "customers",
    "inventory",
    "returns",
    "support",
    "styling",
    "reports",
    "attendance",
    "profile",
  ],
  STORE_MANAGER: [
    "dashboard",
    "sales",
    "orders",
    "customers",
    "inventory",
    "returns",
    "team",
    "reports",
    "attendance",
    "profile",
  ],
  SALES_EXECUTIVE: [
    "dashboard",
    "products",
    "customers",
    "assisted",
    "orders",
    "offers",
    "performance",
    "attendance",
    "profile",
  ],
  INVENTORY_MANAGER: [
    "dashboard",
    "inventory",
    "movements",
    "transfers",
    "low-stock",
    "receive",
    "adjust",
    "products",
    "reports",
    "profile",
  ],
  INVENTORY_STAFF: [
    "dashboard",
    "inventory",
    "receive",
    "adjust",
    "transfers",
    "low-stock",
    "attendance",
    "profile",
  ],
  WAREHOUSE_STAFF: [
    "dashboard",
    "warehouse",
    "pick-pack",
    "transfers",
    "inventory",
    "attendance",
    "profile",
  ],
  CUSTOMER_SUPPORT: [
    "dashboard",
    "customers",
    "orders",
    "returns",
    "support",
    "performance",
    "profile",
  ],
  FASHION_STYLIST: [
    "dashboard",
    "styling",
    "appointments",
    "bridal",
    "customers",
    "products",
    "performance",
    "profile",
  ],
};

export const navigationForRole = (roleId, hasPermission) => {
  const sequence = ROLE_NAV_SEQUENCE[roleId] ?? ROLE_NAV_SEQUENCE.SALES_EXECUTIVE;
  const byId = new Map(EMPLOYEE_NAV_ITEMS.map((item) => [item.id, item]));
  return sequence
    .map((id) => byId.get(id))
    .filter(Boolean)
    .filter((item) => !item.permission || hasPermission(item.permission));
};

export const sanitizeEmployeeReturnUrl = (url, fallback = "/employee") => {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    !trimmed.startsWith("/employee")
  ) {
    return fallback;
  }
  if (
    trimmed.startsWith("/employee/login") ||
    trimmed.startsWith("/employee/forgot-password")
  ) {
    return fallback;
  }
  return trimmed;
};

export default {
  EMPLOYEE_BRAND,
  EMPLOYEE_ROUTE_RULES,
  requiredPermissionForPath,
  EMPLOYEE_NAV_ITEMS,
  ROLE_NAV_SEQUENCE,
  navigationForRole,
  sanitizeEmployeeReturnUrl,
};

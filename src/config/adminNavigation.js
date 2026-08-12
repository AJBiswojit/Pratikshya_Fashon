/**
 * PRATIKSHYA FASHON — Admin Portal navigation.
 *
 * One catalogue of business modules, grouped the way the house is run.
 * Phase 10.1 ships Dashboard, Employees, Roles & Permissions, Activity and
 * Profile as working surfaces. Everything else is a clearly-marked
 * placeholder so the portal reads as complete rather than broken.
 */

export const ADMIN_BRAND = {
  name: "PRATIKSHYA FASHON",
  portal: "Admin Portal",
  subtitle: "Business Management & Operations",
  home: "/admin",
  login: "/admin/login",
};

/** Module readiness — drives the SOON marker and the placeholder page. */
export const MODULE_STATUS = {
  READY: "READY",
  SOON: "SOON",
};

export const ADMIN_NAV_GROUPS = [
  {
    id: "overview",
    label: "Overview",
    items: [
      {
        id: "dashboard",
        label: "Dashboard",
        to: "/admin",
        icon: "layout",
        exact: true,
        status: MODULE_STATUS.READY,
      },
    ],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { id: "products", label: "Products", to: "/admin/products", icon: "sparkles", status: MODULE_STATUS.READY },
      { id: "product-review", label: "Product Review", to: "/admin/products/review", icon: "check", status: MODULE_STATUS.READY },
      { id: "categories", label: "Categories", to: "/admin/categories", icon: "grid", status: MODULE_STATUS.READY },
      { id: "collections", label: "Collections", to: "/admin/collections", icon: "layers", status: MODULE_STATUS.READY },
      { id: "offers", label: "Offers", to: "/admin/offers", icon: "tag", status: MODULE_STATUS.READY },
      { id: "media", label: "Media Management", to: "/admin/media", icon: "image", status: MODULE_STATUS.READY },
      { id: "marketing-media", label: "Marketing Media", to: "/admin/media/marketing", icon: "film", status: MODULE_STATUS.READY },
      { id: "inventory", label: "Inventory", to: "/admin/inventory", icon: "boxes", status: MODULE_STATUS.READY },
    ],
  },
  {
    id: "sales",
    label: "Sales",
    items: [
      { id: "orders", label: "Orders", to: "/admin/orders", icon: "bag", status: MODULE_STATUS.READY },
      { id: "customers", label: "Customers", to: "/admin/customers", icon: "users", status: MODULE_STATUS.READY },
      { id: "returns", label: "Returns", to: "/admin/returns", icon: "undo", status: MODULE_STATUS.READY },
    ],
  },
  {
    id: "people",
    label: "People",
    items: [
      { id: "employees", label: "Employees", to: "/admin/employees", icon: "badge", status: MODULE_STATUS.READY },
      { id: "roles", label: "Roles & Permissions", to: "/admin/roles", icon: "shield", status: MODULE_STATUS.READY },
      { id: "attendance", label: "Attendance", to: "/admin/attendance", icon: "clock", status: MODULE_STATUS.READY },
      { id: "performance", label: "Performance", to: "/admin/performance", icon: "target", status: MODULE_STATUS.READY },
    ],
  },
  {
    id: "analytics",
    label: "Analytics",
    items: [
      { id: "sales-analytics", label: "Sales Analytics", to: "/admin/analytics/sales", icon: "trend", status: MODULE_STATUS.SOON },
      { id: "product-analytics", label: "Product Analytics", to: "/admin/analytics/products", icon: "chart", status: MODULE_STATUS.SOON },
      { id: "customer-analytics", label: "Customer Analytics", to: "/admin/analytics/customers", icon: "users", status: MODULE_STATUS.SOON },
      { id: "inventory-analytics", label: "Inventory Analytics", to: "/admin/analytics/inventory", icon: "boxes", status: MODULE_STATUS.SOON },
    ],
  },
  {
    id: "system",
    label: "System",
    items: [
      { id: "activity", label: "Activity Logs", to: "/admin/activity", icon: "list", status: MODULE_STATUS.READY },
      { id: "settings", label: "Settings", to: "/admin/settings", icon: "sliders", status: MODULE_STATUS.SOON },
      { id: "profile", label: "Profile", to: "/admin/profile", icon: "user", status: MODULE_STATUS.READY },
    ],
  },
];

export const ADMIN_NAV_ITEMS = ADMIN_NAV_GROUPS.flatMap((group) => group.items);

/**
 * The nav item a path belongs to.
 *
 * The most specific destination wins, so a nested module such as
 * `/admin/media/marketing` resolves to itself rather than to its parent.
 */
export const findAdminNavItem = (pathname) => {
  if (!pathname || typeof pathname !== "string") return null;
  const cleaned = pathname.split("?")[0];
  return (
    ADMIN_NAV_ITEMS.filter((item) =>
      item.exact ? cleaned === item.to : cleaned === item.to || cleaned.startsWith(`${item.to}/`)
    ).sort((a, b) => b.to.length - a.to.length)[0] ?? null
  );
};

/** Copy for a module that is navigable but not implemented in this phase. */
export const ADMIN_PLACEHOLDER_COPY = {
  products: "Product creation, editing and merchandising move here in a later phase.",
  categories: "Category structure and taxonomy management arrive with the product module.",
  collections: "Curated collection building arrives with the product module.",
  offers: "Offer creation, scheduling and coupon rules arrive with the promotions module.",
  orders: "Full order administration arrives with the order-operations module. Recent orders are already on the dashboard.",
  customers: "Customer administration arrives with the CRM module.",
  returns: "Return administration arrives with the order-operations module.",
  attendance: "House-wide attendance reporting arrives with the workforce module.",
  performance: "House-wide performance reporting arrives with the workforce module.",
  "sales-analytics": "Deep sales analytics arrive with the analytics module. A seven-day overview is on the dashboard.",
  "product-analytics": "Product analytics arrive with the analytics module.",
  "customer-analytics": "Customer analytics arrive with the analytics module.",
  "inventory-analytics": "Inventory analytics arrive with the analytics module.",
  settings: "Business settings arrive once the operational modules above are in place.",
};

/**
 * Only same-origin `/admin` destinations may be used as a return URL.
 * Anything else falls back to the dashboard.
 */
export const sanitizeAdminReturnUrl = (url, fallback = "/admin") => {
  if (!url || typeof url !== "string") return fallback;
  const trimmed = url.trim();
  if (
    trimmed.startsWith("//") ||
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("javascript:") ||
    trimmed.startsWith("data:") ||
    !trimmed.startsWith("/admin")
  ) {
    return fallback;
  }
  if (trimmed.startsWith("/admin/login")) return fallback;
  return trimmed;
};

export default {
  ADMIN_BRAND,
  MODULE_STATUS,
  ADMIN_NAV_GROUPS,
  ADMIN_NAV_ITEMS,
  ADMIN_PLACEHOLDER_COPY,
  findAdminNavItem,
  sanitizeAdminReturnUrl,
};

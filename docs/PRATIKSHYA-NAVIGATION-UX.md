# PRATIKSHYA FASHON — Navigation UX Overhaul (Phase 21.3)

Navigation & UX overhaul for **both** the Admin Portal and the Employee
Portal. This phase is navigation-only: no business modules, no new
permission system, no new routing, no customer-storefront changes, and no
changes to AI Mirror / AI Shopping / AI Business logic.

---

## 1. Goal

- **Admin** navigation answers: *"What do I need to manage or monitor?"*
- **Employee** navigation answers: *"What do I need to do for my job?"*

Both sidebars are grouped around **business responsibilities** rather than
internal code architecture, are collapsible, role-aware (employee), and
render as a proper drawer on mobile.

---

## 2. Single source of truth

- **Admin:** `src/config/adminNavigation.js` — `ADMIN_NAV_GROUPS`,
  `resolveActiveNavId`, `flattenAdminNavLinks`.
- **Employee:** `src/config/employeeNavigation.js` — `EMPLOYEE_NAV_GROUPS`,
  `navigationForRole`, `resolveActiveNavId`, `flattenEmployeeNavLinks`.

There is exactly **one** navigation definition per portal. The header and
drawer share it — no duplicate nav configs. Both portals render through a
single shared presentational component: `src/components/navigation/PortalSidebar.jsx`.

---

## 3. Admin hierarchy

| Section                 | Items                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Overview**            | Dashboard, Analytics, AI Assistant                          |
| **Catalogue & Content** | Products *(Product Review)*, Categories, Collections, Offers, Media Management *(Marketing Media)* |
| **Orders & Customers**  | Orders, Customers, Returns                                  |
| **Inventory & Operations** | Inventory *(Receive, Adjust, Transfers, Movements, Low Stock)* |
| **Workforce**           | Employees, Attendance, Performance, Roles                   |
| **System**              | Activity, Settings                                          |

Footer: **Profile**, **Sign out**.

Notes on routes actually represented:
- Product Review (`/admin/products/review`) is nested under Products.
- Marketing Media (`/admin/media/marketing`) is nested under Media Management.
- Inventory operations (`/admin/inventory/{receive,adjust,transfers,movements,low-stock}`) are nested under Inventory.
- There is **no** standalone Admin "Warehouse" or "Locations" page — those
  live as inventory location filters, so no fake nav link was added.
- Product/category/collection **detail routes** (`/admin/products/:id`,
  `/admin/products/:id/edit`, `/admin/products/:id/media`, etc.) keep their
  parent item active via longest-prefix matching; they are not separate links.

---

## 4. Employee hierarchy

| Section                 | Items                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Overview**            | Dashboard                                                   |
| **Sales & Orders**      | Orders, Assisted Orders, Offers, Products, Customers        |
| **Inventory & Operations** | Inventory *(Stock movements, Transfers, Low stock, Receive, Adjust)*, Warehouse *(Pick & pack)*, Returns, Support |
| **Media & Styling**     | Media Management, Styling *(Appointments, Bridal desk)*     |
| **Workforce**           | Attendance, Leave, Performance, Team                        |
| **Reports**             | Reports, Sales                                              |
| **People**              | Employees (Super Admin only)                                |

Footer: **Profile**, **Sign out**.

---

## 5. Role-aware visibility (employee)

Employee visibility comes **only** from the existing permission catalogue
(`employeePermissions.js`) through `authorization.js`/`hasPermission`. No
second authorization system was created. Verified default output:

- **Super Admin** — all sections including People (Employees).
- **Store Manager** — Dashboard, Sales & Orders (no Assisted — no
  `orders.create`), Inventory & Operations, Media & Styling, Workforce, Reports.
- **Sales Executive** — Dashboard, Sales & Orders (incl. Assisted Orders),
  Inventory (low stock), Workforce.
- **Inventory Manager** — Dashboard, Orders/Products, Inventory (all ops),
  Warehouse, Media, Workforce (incl. Team), Reports.
- **Inventory Staff** — Dashboard, Products, Inventory (ops), Workforce.
- **Warehouse Staff** — Dashboard, Orders/Products, Inventory, Warehouse
  (Pick & pack), Media, Workforce.
- **Customer Support** — Dashboard, Orders/Offers/Products/Customers,
  Inventory (low stock), Returns, Support, Workforce, Reports.
- **Fashion Stylist** — Dashboard, Offers/Products/Customers, Inventory
  (low stock), Media & Styling, Workforce.

### Admin authorization

Admin uses a single role (`SUPER_ADMIN`); the sidebar shows all modules.
Access is still enforced by `AdminProtectedRoute`. Admin modules are never
exposed to customers or through employee navigation.

---

## 6. Active-route rules

Both portals use **longest-prefix matching** (`resolveActiveNavId`) so
exactly one item is active and a detail page keeps its parent highlighted:

- Dashboard → `/admin`, `/employee` (exact)
- Products → `/admin/products`, `/admin/products/new`,
  `/admin/products/:id`, `/admin/products/:id/edit`, `/admin/products/:id/media`
- Product Review → `/admin/products/review` (wins over Products)
- Media → `/admin/media`, `/admin/media/upload`, `/admin/media/:id`
- Marketing Media → `/admin/media/marketing` (wins over Media)
- Inventory → `/admin/inventory` + all `/admin/inventory/*` children
- Orders → `/admin/orders`, `/admin/orders/:id`, `/admin/orders/:id/invoice`
- Employee Orders → `/employee/orders`, `/employee/orders/:id`
- Assisted Orders → `/employee/orders/assisted`
- Leave → `/employee/attendance/leave` (beats the broader Attendance)

Active state is not colour-only: **dark ink background + terracotta accent
left bar + accent icon + medium text weight**, plus `aria-current="page"`.
Footer links compute their own active state.

---

## 7. Collapsible groups

- Every section header is a `<button aria-expanded aria-controls>`.
- The group of the current route **auto-expands** on navigation and stays
  open while navigating inside it.
- The user's expanded/collapsed preference is persisted in localStorage
  (`pf_admin_nav_groups`, `pf_employee_nav_groups` — separate keys).
- **Overview stays immediately visible** by default; other groups collapse
  to keep the sidebar compact.

---

## 8. Mobile drawer

At 768px and below the sidebar is a fixed drawer (`w-72`) over a backdrop.

- Topbar **Menu** button opens it (`aria-expanded`).
- Tapping the backdrop closes it; **clicking a nav link** closes it; the
  route-change effect also closes it; **Escape closes it**.
- The drawer scrolls internally (identity pinned, nav scrolls, footer
  pinned); no horizontal overflow; body lock released on close.
- Breakpoints exercised: 1440 / 1280 / 1024 / 834 / 768 / 430 / 390 / 375.

---

## 9. Desktop collapsed mode

Not implemented. Per the phase guidance, a polished expanded sidebar is
preferred over a forced collapsed mode; the architecture supports a clean
expanded sidebar, so no icon-only mode was added.

---

## 10. Icons

All icons come from the project's existing single icon dependency
(`lucide-react`) via `adminNavIcons.js` and `employee/navIcons.js`. Config
files name icons; maps resolve them (config never imports React). Icons are
decorative (`aria-hidden`) where a label is present.

---

## 11. Badges (real data only)

Only the employee portal shows badges, computed in
`src/components/employee/useEmployeeNavBadges.js` from existing
contexts/selectors — nothing invented, nothing polled:

| Badge     | Source                                            |
| --------- | ------------------------------------------------- |
| Orders    | active (non-terminal) orders from `OrderContext`  |
| Inventory | low-stock count from `InventoryContext.metrics`   |
| Media     | media pending review from `mediaRepository`       |
| Leave     | pending leave count from `leaveService`           |

Admin has no reliable per-module counters wired up, so Admin shows no badges
rather than fake counts.

---

## 12. "Coming Soon" audit

- **Employee:** no sidebar item was ever marked "Coming Soon" (verified).
- **Admin:** the old `MODULE_STATUS.SOON` marker existed but no live module
  was marked SOON (all listed modules are implemented and routed). The
  remaining SOON plumbing (`MODULE_STATUS`, `ADMIN_PLACEHOLDER_COPY`, the
  un-routed `AdminModulePlaceholder`) is retained only for compatibility and
  is not used by the sidebar. No implemented module shows "Soon".

---

## 13. Accessibility

- Semantic `<nav aria-label="...">` for each portal.
- Collapsible groups are `<button aria-expanded aria-controls>`.
- Active link carries `aria-current="page"`.
- All nav links are keyboard accessible with a logical tab order and the
  theme's visible focus ring.
- Icons are `aria-hidden`; labels are real text.
- Escape closes each mobile drawer.

---

## 14. What was NOT changed

- Customer UI (landing, shop, categories, collections, product, cart,
  wishlist, checkout, My PRATIKSHYA, AI Mirror, AI Shopping).
- AI Mirror / AI Shopping / AI Business logic.
- Business logic (products, inventory, orders, fulfillment, returns,
  offers, taxonomy, media, attendance, performance, analytics, settings,
  auth).
- Route set in `App.jsx` (unchanged; no duplicate routes added).
- `AdminProtectedRoute`, employee route guards, and service-layer
  authorization remain intact.

---

## 15. Routes audited

**Admin:** `/admin/login`, `/admin`, `/admin/analytics`,
`/admin/analytics/*`, `/admin/ai-assistant`, `/admin/products`,
`/admin/products/new`, `/admin/products/review`, `/admin/products/:id`,
`/admin/products/:id/edit`, `/admin/products/:id/media`, `/admin/categories`,
`/admin/categories/new`, `/admin/categories/:id`, `/admin/categories/:id/edit`,
`/admin/categories/:id/subcategories`, `/admin/collections`,
`/admin/collections/new`, `/admin/collections/:id`, `/admin/collections/:id/edit`,
`/admin/collections/:id/products`, `/admin/offers`, `/admin/offers/new`,
`/admin/offers/:id`, `/admin/offers/:id/edit`, `/admin/media`,
`/admin/media/upload`, `/admin/media/review`, `/admin/media/marketing`,
`/admin/media/:id`, `/admin/orders`, `/admin/orders/:id`,
`/admin/orders/:id/invoice`, `/admin/customers`, `/admin/customers/:id`,
`/admin/returns`, `/admin/returns/:id`, `/admin/inventory`,
`/admin/inventory/{receive,adjust,transfers,movements,low-stock}`,
`/admin/employees`, `/admin/employees/new`, `/admin/employees/:id`,
`/admin/employees/:id/edit`, `/admin/roles`, `/admin/roles/:id`,
`/admin/attendance`, `/admin/attendance/:id`, `/admin/performance`,
`/admin/performance/:id`, `/admin/activity`, `/admin/settings`, `/admin/profile`.

**Employee:** `/employee/login`, `/employee`, `/employee/profile`,
`/employee/attendance`, `/employee/attendance/leave`, `/employee/performance`,
`/employee/performance/:id`, `/employee/media`, `/employee/media/upload`,
`/employee/media/:id`, `/employee/products`, `/employee/products/new`,
`/employee/products/:id/edit`, `/employee/customers`, `/employee/orders`,
`/employee/orders/:id`, `/employee/orders/assisted`, `/employee/offers`,
`/employee/offers/new`, `/employee/offers/:id`, `/employee/offers/:id/edit`,
`/employee/inventory`, `/employee/inventory/{movements,transfers,low-stock,receive,adjust}`,
`/employee/warehouse{,/pick-pack}`, `/employee/returns`, `/employee/support`,
`/employee/styling{,/appointments,/bridal}`, `/employee/sales`, `/employee/team`,
`/employee/reports`, `/employee/management{,/new,/activity,:id}`,
`/employee/access-denied`, `/employee/change-password`.

---

## 16. Build & tests

- `npm run build` — passes.
- `npm test` — all existing tests pass (36/36).
- `git diff --check` — clean.

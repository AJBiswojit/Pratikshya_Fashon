# PRATIKSHYA FASHON — Employee Portal Navigation (Phase 21.3)

Navigation & UX overhaul for the Employee Portal sidebar. This phase is
navigation-only: no business modules, no new permission system, no new
routing, no customer/admin UI changes.

---

## 1. Goal

The sidebar answers one question immediately: **"Where do I go to do my
work?"** Navigation is organised around *work* (sales, operations, styling,
workforce) rather than a flat list of implementation modules, and each role
sees only the sections its existing permissions allow.

---

## 2. Information architecture

The employee sidebar is grouped into collapsible sections:

| Section                 | Items                                                       |
| ----------------------- | ----------------------------------------------------------- |
| **Overview**            | Dashboard                                                   |
| **Sales & Orders**      | Orders, Assisted Orders, Offers, Products, Customers        |
| **Inventory & Operations** | Inventory *(Stock movements, Transfers, Low stock, Receive, Adjust)*, Warehouse *(Pick & pack)*, Returns, Support |
| **Media & Styling**     | Media Management, Styling *(Appointments, Bridal desk)*     |
| **Workforce**           | Attendance, Leave, Performance, Team                        |
| **Reports**             | Reports, Sales                                              |
| **People**              | Employees (Super Admin only)                                |

Operational sub-routes are nested inside their parent section as indented
children, so every existing employee destination stays reachable while the
primary structure stays clean.

### Sidebar regions

```
────────────────────────────────────────────
PRATIKSHYA FASHON — Employee Portal
[Avatar]  Kavya Menon
          Super Admin
────────────────────────────────────────────
  OVERVIEW ▾
    Dashboard
  SALES & ORDERS ▸
  INVENTORY & OPERATIONS ▸
  ...
────────────────────────────────────────────
  Profile
  Sign out
────────────────────────────────────────────
```

- **Identity header** uses the real authenticated employee (name, role,
  avatar/initial). Never hardcoded.
- **Footer** holds Profile and Sign out. Sign out uses the existing
  `signOut` from `EmployeeAuthContext` — no new auth path.

---

## 3. Single source of truth

`src/config/employeeNavigation.js` remains the **one** employee navigation
definition:

- `EMPLOYEE_NAV_GROUPS` — grouped catalogue (replaces the old flat
  `EMPLOYEE_NAV_ITEMS` / `ROLE_NAV_SEQUENCE`).
- `navigationForRole(roleId, hasPermission)` — returns the groups/items this
  employee may see, filtered by the existing permission catalogue.
- `EMPLOYEE_ROUTE_RULES` + `requiredPermissionForPath` — unchanged. Route
  guards in `EmployeeLayout` still enforce access.
- `resolveActiveNavId` / `flattenEmployeeNavLinks` — longest-prefix active
  route resolution.

No second permission system was introduced. **No new
`employeeSidebarPermissions.js` or `employeeNavigationPermissions.js`.**

---

## 4. Permission source

Permissions come exclusively from:

- `src/config/employeePermissions.js` — the permission catalogue.
- `src/services/employees/authorization.js` — `hasPermission` etc.
- `src/config/employeeRoles.js` — role default permission sets.

The sidebar checks `hasPermission`, the route guard checks the same
permission, and the service layer continues to enforce on mutations. A user
who types `/employee/inventory`, `/employee/media`, `/employee/orders` or
`/employee/performance` without the required permission is still blocked.

---

## 5. Role-aware visibility (verified)

Sidebar output for default role permissions:

- **Super Admin** — all sections, including People (Employees).
- **Store Manager** — Dashboard, Sales & Orders, Inventory & Operations,
  Media & Styling, Workforce, Reports. (No Assisted Orders — manager has no
  `orders.create`.)
- **Sales Executive** — Dashboard, Sales & Orders (incl. Assisted Orders),
  Inventory (low stock), Workforce.
- **Inventory Manager** — Dashboard, Orders/Products, Inventory (all child
  ops), Warehouse, Media, Workforce (incl. Team), Reports.
- **Inventory Staff** — Dashboard, Products, Inventory (child ops), Workforce.
- **Warehouse Staff** — Dashboard, Orders/Products, Inventory, Warehouse
  (Pick & pack), Media, Workforce.
- **Customer Support** — Dashboard, Orders/Offers/Products/Customers,
  Inventory (low stock), Returns, Support, Workforce, Reports.
- **Fashion Stylist** — Dashboard, Offers/Products/Customers, Inventory
  (low stock), Media & Styling, Workforce.

Visibility is derived from existing permissions, never from role examples.

---

## 6. Collapsible groups

- Every section header is a `<button aria-expanded>` that toggles its item
  list.
- The group of the **current active route auto-expands** on navigation and
  stays open while navigating inside it.
- The user's expanded/collapsed preference is persisted in localStorage
  (`pf_employee_nav_groups`).
- **Overview stays immediately visible** by default on first visit; other
  groups collapse to keep the sidebar compact.

---

## 7. Active-route handling

`resolveActiveNavId` uses **longest-prefix** matching so exactly one item is
active:

- Dashboard → `/employee`
- Orders → `/employee/orders`, `/employee/orders/:orderId`
- Assisted Orders → `/employee/orders/assisted`
- Inventory → `/employee/inventory` + every `/employee/inventory/*` child
- Media Management → `/employee/media`, `/employee/media/upload`,
  `/employee/media/:mediaId`
- Leave → `/employee/attendance/leave` (beats the broader Attendance)
- Performance → `/employee/performance[/:employeeId]`

Active treatment is not colour-only: **dark ink background + terracotta
accent left bar + accent icon + medium text weight**, plus
`aria-current="page"`.

---

## 8. Density & labels

- Compact nav row height, tight icon-to-label gaps, consistent group
  spacing and section-heading hierarchy.
- Long labels ("Media Management", "Assisted Orders") are truncated with a
  native `title` tooltip — no clipping, no awkward wrapping, no horizontal
  overflow.

---

## 9. Icons

All icons come from the project's existing single icon dependency
(`lucide-react`) via `src/components/employee/navIcons.js`. Icons are
decorative (`aria-hidden`) where a label is present.

---

## 10. Badges (real data only)

`src/components/employee/useEmployeeNavBadges.js` computes compact counts
from existing lightweight selectors/contexts — nothing invented, nothing
polled:

| Badge     | Source                                            |
| --------- | ------------------------------------------------- |
| Orders    | active (non-terminal) orders from `OrderContext`  |
| Inventory | low-stock count from `InventoryContext.metrics`   |
| Media     | media pending review from `mediaRepository`       |
| Leave     | pending leave count from `leaveService`           |

---

## 11. Mobile drawer

- The sidebar becomes a fixed drawer (`w-72`) behind a backdrop on narrow
  screens.
- The topbar **Menu** button opens it (`aria-expanded`).
- Tapping the backdrop closes it; **clicking a nav link** closes it; the
  route-change effect also closes it; **Escape closes it**.
- The drawer scrolls internally (identity pinned, nav scrolls, footer
  pinned); the page has no horizontal overflow (`body { overflow-x: hidden }`).
- Breakpoints exercised: 1440 / 1280 / 1024 / 834 / 768 / 430 / 390 / 375.

---

## 12. Accessibility

- Semantic `<nav aria-label="Employee portal">`.
- Collapsible groups are `<button aria-expanded aria-controls>`.
- Active link carries `aria-current="page"`.
- All nav links are keyboard accessible and appear in logical tab order.
- Icons are `aria-hidden`; labels are real text.
- Escape closes the drawer; visible focus uses the existing theme focus
  ring.

---

## 13. What was NOT changed

- Customer UI (landing, shop, product, cart, wishlist, checkout, My
  PRATIKSHYA, AI Mirror/Shopping).
- Admin UI / Admin sidebar.
- Business logic (inventory, order/return lifecycle, offers, attendance,
  performance, analytics, media/product repositories, taxonomy, AI, auth).
- Route set in `App.jsx` — unchanged; no duplicate routes added.

---

## 14. Routes audited

Verified as reachable and guard-protected:

`/employee/login`, `/employee`, `/employee/profile`,
`/employee/attendance`, `/employee/attendance/leave`, `/employee/performance`,
`/employee/performance/:employeeId`, `/employee/media`, `/employee/media/upload`,
`/employee/media/:mediaId`, `/employee/products`, `/employee/products/new`,
`/employee/products/:productId/edit`, `/employee/customers`, `/employee/orders`,
`/employee/orders/:orderId`, `/employee/orders/assisted`, `/employee/offers`,
`/employee/offers/new`, `/employee/offers/:offerId/edit`,
`/employee/offers/:offerId`, `/employee/inventory`,
`/employee/inventory/{movements,transfers,low-stock,receive,adjust}`,
`/employee/warehouse{,/pick-pack}`, `/employee/returns`, `/employee/support`,
`/employee/styling{,/appointments,/bridal}`, `/employee/sales`, `/employee/team`,
`/employee/reports`, `/employee/management{,/new,/activity,:employeeId}`,
`/employee/access-denied`, `/employee/change-password`.

---

## 15. Build & tests

- `npm run build` — passes.
- `npm test` — all existing tests pass (36/36).
- `git diff --check` — clean.

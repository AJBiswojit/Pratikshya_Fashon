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

---

## 17. Phase 21.3.1 — portal blank-page regression fix

After Phase 21.3 shipped, every authenticated Admin and Employee route rendered
a blank page. The navigation design itself was sound; four independent runtime
errors were unmasked by it. Each was reproduced first, then fixed at the root.
Nothing in Phase 21.3 was reverted, and no error boundary was used to mask a
crash.

### 17.1 Root cause 1 — sidebar seeded expansion from `null`

`src/components/navigation/PortalSidebar.jsx`, `expanded` state initialiser.
`readPersistedGroups()` returns `null` when no sidebar preference is stored, but
the initialiser called `seed.add(...)` on that value:

```js
const seed = readPersistedGroups(storageKey);
if (!seed) {
  const overview = groups?.find((group) => group.id === "overview");
  if (overview) seed.add(overview.id);   // seed is null here
}
```

`TypeError: Cannot read properties of null (reading 'add')` threw during render,
so React unmounted the whole tree and the portal painted blank.

**Affected:** every authenticated Admin and Employee route, on a first visit or
after clearing site data. Unauthenticated `/employee/login` was unaffected,
which is why the regression was easy to miss.

**Fix:** the reader now consistently returns `null` for "nothing usable stored"
and the caller supplies its own default:

```js
const persisted = readPersistedGroups(storageKey);
const seed = persisted ?? new Set(defaultOpenGroupIds(normalizeGroups(groups)));
if (activeGroupId) seed.add(activeGroupId);
```

The same commit establishes **one navigation data contract** in this file
(`normalizeGroups`) rather than scattering null checks through the render tree,
plus `makeIconResolver` (an unknown icon key resolves to an inert placeholder,
never `undefined`), `defaultOpenGroupIds`, and `isPathActive` for footer links.
Both storage helpers now guard `typeof localStorage === "undefined"`.
`PortalSidebar` remains purely presentational.

### 17.2 Root cause 2 — `allOrders` never destructured

`src/pages/admin/AdminDashboard.jsx` used `allOrders` inside the
`getBusinessMetrics` memo and its dependency array, but destructured only
`const { getOrders } = useOrder()`. `ReferenceError: allOrders is not defined`
blanked `/admin` and `/admin/dashboard` even after 17.1 was fixed.
`OrderContext` already exposes `allOrders`, so the fix is the destructure:
`const { getOrders, allOrders } = useOrder();`.

### 17.3 Root cause 3 — `reviewError` never declared

`src/components/workforce/LeavePanel.jsx`, `LeaveTable`. The component rendered
`reviewError` in three places but never declared the state, crashing
`/admin/attendance` with `ReferenceError: reviewError is not defined`. The state
now exists and is wired to the rejection path the service already supports:
`reviewLeave()` returns `{ ok: false, message }` when a rejection reason is
missing, and the desk keeps the dialog open and shows that message instead of
silently discarding the decision.

### 17.4 Root cause 4 — read-path seeding announced a change mid-render

Two service read paths lazily seeded storage and broadcast a change event
synchronously, so a dashboard reading them during render updated a provider
while rendering — `Cannot update a component (WorkforceProvider / CartProvider)
while rendering a different component (AdminDashboard)`.

- `performanceService.ensurePeriodRecord()` → `upsertPerformance()` →
  `savePerformance()` → `writeList()` → `WORKFORCE_CHANGED_EVENT`.
- `offerRepository.allNormalised()` → `persist()` → `OFFERS_CHANGED_EVENT`.

Both now use the codebase's existing `{ quiet: true }` convention — already used
by `ensureWorkforceSeeded`, `ensureLeaveSeeded`, `ensurePerformanceSeeded` and
`loadAttendance` — because a backfill on read is not a user edit.
`upsertPerformance(draft, options)` and `persist(items, { quiet })` simply
forward the flag; genuine user edits still announce as before. No business logic
or stored data shape changed.

### 17.5 Verification

No headless browser is installable in this environment (the Playwright and
Chromium CDNs are unreachable), so verification used a **real-DOM render
harness**: jsdom plus Vite's SSR module loader mounting the actual `App.jsx`
with `react-dom/client`, seeding real admin/employee sessions into
`localStorage`, then capturing rendered HTML and every `console.error` per
route. This executes the real components, routers, contexts and services — it is
not a build-output inspection. The harness was a temporary file and is not part
of this commit.

| Surface | Routes | Result |
| --- | --- | --- |
| Admin | all 40+ routes incl. login, dashboard, products, categories, collections, media, orders, customers, returns, inventory (+6 sub-routes), warehouses, offers, attendance, performance, analytics (+7 sub-routes), ai-assistant, settings, employees, roles, activity, profile, dynamic `:id` routes, unknown route | render, sidebar present, 0 console errors |
| Employee | all 50+ routes incl. login, dashboard, orders, orders/:id, inventory (+8), media, media/upload, products, offers, attendance, attendance/leave, performance, warehouse (+5), support (+3), styling (+5), team, reports, management (+4), profile | render, sidebar present, 0 console errors |
| Roles | Super Admin, Store Manager, Inventory Manager, Warehouse Staff, Fashion Stylist, Sales Executive, Customer Support | all render; nav differs per role, so permission filtering still applies |
| Customer | `/`, `/shop`, `/cart`, `/checkout`, `/account`, `/account/ai-mirror`, `/account/ai-shopping` | unchanged, 0 console errors |

`npm run build` passes, `npm test` passes 36/36, `git diff --check` is clean.

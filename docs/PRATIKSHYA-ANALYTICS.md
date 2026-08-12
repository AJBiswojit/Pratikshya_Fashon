# PRATIKSHYA FASHON — Centralized Business Analytics

Phase 19. A **read / aggregation layer** over the systems that already run the
house. It does not invent a second catalogue of orders, products, customers,
inventory, returns, offers or employees.

This is frontend/demo architecture. It is **not** real-time analytics,
warehouse-grade BI, financial accounting or audited reporting.

---

## 1. Architecture

```
Admin / Employee analytics pages
        │
        ▼
getAnalyticsSnapshot()          one snapshot per period + filters
        │
        ├── orderService / OrderContext
        ├── catalogRepository
        ├── taxonomyRepository
        ├── inventoryRepository
        ├── offerRepository
        ├── returnService (records live on orders)
        ├── customer registry (Auth + demo customers)
        ├── employeeService
        └── workforce attendance + performance (Phase 18)
```

There is no `fakeAnalytics`, `demoAnalytics`, `adminAnalytics` or
`salesAnalyticsDataset`. Charts are drawn from the snapshot. The same
repositories and date range always produce the same numbers.

Date arithmetic lives in `src/services/analytics/dateRange.js` and reuses
Phase 18 `workforce/dateUtils`. CSV export reuses `downloadCsv` from the same
module. No new chart library was added — the project still has none.

---

## 2. Data sources

| Domain | Source | Notes |
| --- | --- | --- |
| Orders / revenue | `pratikshya_orders` via `orderService` | Includes seeded demo orders when the browser is empty |
| Products | `catalogRepository` | Existing identities, SKUs, prices |
| Categories / collections | `taxonomyRepository` | Never hardcoded fashion labels |
| Customers | `pratikshya_customers_registry` + `pratikshya_customers` + `INITIAL_DEMO_CUSTOMERS` + order identities | No second CRM |
| Inventory | `inventoryRepository` | Stock, movements, locations, transfers |
| Returns | `order.returns` + `returnService.getReturnMetrics` | Existing return reason catalogue |
| Offers | `offerRepository` + order coupon fields | Redemptions from real orders |
| Fulfillment | `order.fulfillment` timestamps | Durations only when both ends exist |
| Employees | `employeeService` + Phase 18 performance | Same score, not a second one |
| Attendance | `attendanceService.summarizeRecords` | Same credit rules as Phase 18 |

---

## 3. Revenue rule

One definition, used for revenue tiles, the trend, AOV and product/category
roll-ups:

1. **Exclude** `CANCELLED` orders.
2. **Exclude** failed or cancelled payments (`FAILED`, `CANCELLED`).
3. **Gross sales** = `order.pricing.total` of eligible orders.
4. **Refunds** = completed refund amounts (`RETURN` / order status `REFUNDED`).
5. **Revenue** = max(0, gross − completed refunds).

Pending payment is not treated as a failed payment. Cancelled orders never
contribute units or revenue.

This is **not profit**. Discounts are shown separately. COGS / margin are not
calculated because product cost is not configured.

---

## 4. Average order value

```
AOV = eligible revenue / eligible orders
```

Same eligibility as the revenue rule. Zero eligible orders → AOV is not shown
as a fabricated rupee figure.

---

## 5. Orders

Status distribution uses `ORDER_STATUS` from `orderConfig.js`. Legacy
`PLACED` / `CONFIRMED` fold into Pending Payment / Confirmed. No second
status catalogue.

Outcomes (completion, cancellation, return, refund rates) are counts of
orders in the selected period divided by that period’s order total.

---

## 6. Products, categories, collections

Product rows are built from order lines in the period, joined to
`catalogRepository` and current available stock from
`inventoryRepository`. Ranking defaults to revenue; units and orders are
available. Margin ranking is withheld because cost does not exist.

Category and collection tables resolve labels through `taxonomyRepository`
and only include collections a sold product actually belongs to.

Clicking a product opens the existing `/admin/products/:productId` page.

---

## 7. Customers

Segmentation is the directory’s existing rule, not a second engine:

| Segment | Rule |
| --- | --- |
| HIGH VALUE | Lifetime eligible spend > ₹40,000 |
| RETURNING | More than one lifetime order |
| ACTIVE | At least one lifetime order |
| NEW | No orders yet |

New / returning **in the period** use `createdAt` / first order timestamps.
Top customers link to `/admin/customers/:customerId` when the identity exists
in the registry.

---

## 8. Inventory

On-hand, available, reserved, returned, damaged, low, out and overstocked
come from `getInventoryMetrics` / `calculateStockStatus`. Movement totals
read the existing ledger, filtered by the selected dates.

**Retail value** = available × selling price, labelled as retail value.

**Cost valuation** is not shown as a number. The UI states:

> Inventory valuation unavailable — cost data not configured.

---

## 9. Returns and offers

Return request / approved / rejected / received / inspected / refunded
counts use `getReturnMetrics` on period-filtered return records. Reasons use
`RETURN_REASONS` only.

Offer rows join `offerRepository` to orders whose `pricing.couponCode` or
`pricing.offerId` match. The money column is **Revenue influenced by offer**,
never profit.

---

## 10. Fulfillment

Pipeline and bottleneck counts are **current** operational queues.

Average fulfillment / dispatch / delivery hours are computed only when both
timestamps exist on the fulfillment record. Otherwise the UI says
“Insufficient fulfillment history”.

Location tables report orders fulfilled from `fulfillment.sourceLocationId`.
That is not claimed as storefront sales by floor.

---

## 11. Employees and attendance

Employee analytics reuse:

- `housePerformanceSummary` / Phase 18 scores
- `summarizeRecords` / attendance credit
- Role-aware targets already on the performance record

Top performers, needs attention and review pending are the Phase 18 lists.
Clicks go to the existing performance profile.

---

## 12. Date filters and comparison

Presets: Today, Yesterday, Last 7 Days, Last 30 Days, This Month, Last Month,
This Quarter, This Year, Custom Range.

Comparison is the immediately previous equivalent window (last 7 vs previous
7, this month vs previous month, and so on). Percentage change is omitted
when the previous period has no meaningful denominator (including zero).
There is no divide-by-zero path.

Trend granularity: daily (≤ 45 days), weekly (≤ 180), monthly otherwise.

---

## 13. Permissions and privacy

Added to the existing catalogue (`employeePermissions.js`):

| Key | Meaning |
| --- | --- |
| `analytics.view` | Open the reports desk |
| `analytics.sales` | Sales / order analytics |
| `analytics.products` | Product / category / collection |
| `analytics.customers` | Customer analytics |
| `analytics.inventory` | Inventory / location |
| `analytics.returns` | Return analytics |
| `analytics.offers` | Offer financial performance |
| `analytics.employees` | Attendance + performance roll-up |

| Role | Access |
| --- | --- |
| Super Admin / Admin Portal | Full |
| Store Manager | All analytics sections |
| Inventory Manager | Inventory + products |
| Customer Support | Customers + returns |
| Sales / Warehouse / Stylist / ordinary staff | No business analytics desk unless a key is granted |

The Admin Portal remains a Super Admin boundary (`AdminProtectedRoute`).
Employee section URLs are also checked — hiding a tab is not the only
control.

Customers never see revenue, employee performance, inventory value, internal
return analytics or offer financials.

---

## 14. Export and activity

**Export CSV** writes the filtered snapshot with the existing native CSV
helper. No PDF. Export records `ANALYTICS_EXPORT` on the shared activity
diary. Page views are not logged.

---

## 15. Surfaces

**Admin**

- `/admin/analytics` and section routes (`/sales`, `/products`, `/customers`,
  `/inventory`, `/returns`, `/offers`, `/employees`)
- Sidebar: Analytics is READY (Coming Soon removed)
- Dashboard: **View analytics** CTA; today’s sales / month orders / customers /
  returns now read the same snapshot

**Employee**

- `/employee/reports` and the same section suffixes, limited by permission

---

## 16. Demo limitations / future backend

- Browser localStorage. Deterministic given the same stores.
- Seeded demo orders may appear when the order store is empty — they are the
  existing Phase 15 seed, not an analytics seed.
- Tax analytics is not configured: orders do not store GST separately.
- Cost / margin / profit are not calculated.
- Not a general ledger. Not real-time. Not audited.
- A future reporting API can replace `getAnalyticsSnapshot` without changing
  the pages.

---

## 17. Files

```
src/services/analytics/dateRange.js
src/services/analytics/analyticsService.js
src/services/analytics/analyticsExport.js
src/services/analytics/index.js
src/components/analytics/*
src/pages/admin/analytics/AdminAnalytics.jsx
src/pages/employee/EmployeeReports.jsx
docs/PRATIKSHYA-ANALYTICS.md
```

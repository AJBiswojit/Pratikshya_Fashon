# Employee Management — Backend API Contract

**Audience:** the backend developer implementing employee-account management.
**Frontend seam:** `src/services/employees/employeeService.js` (all operations below already exist as service functions; the backend replaces their storage layer 1:1).
**Authorization model:** employee-account management is a **SUPER_ADMIN (Admin-domain) capability**. Employee sessions can never perform account administration — the frontend already enforces this at its service layer, and the backend must enforce it again server-side.

---

## 1. Identity domains

Two disjoint identity domains. **They must never merge.**

| Domain | ID format | Store | Authenticates at | Example |
|---|---|---|---|---|
| Admin | `PF-ADM-#####` | admin accounts table | `POST /admin/auth/login` (`/admin/login`) | Kavya Menon · `PF-ADM-00001` · `SUPER_ADMIN` |
| Employee | `PF-<ROLE>-#####` | employees table | `POST /employee/auth/login` (`/employee/login`) | Vikram Iyer · `PF-MGR-00008` · `STORE_MANAGER` |

Rules the backend must guarantee:

- An employee record can **never** hold role `SUPER_ADMIN` and can **never** have an `PF-ADM-*` ID.
- An admin identity **never** appears in employee listings, employee selectors or employee login.
- Employee IDs are **deterministic and unique**: `PF-{rolePrefix}-{5 digits}`, generated server-side (see `src/services/employees/employeeId.js` for the reference algorithm). Never regenerate an existing ID.

## 2. Employee object

```jsonc
{
  "id": "emp-mgr-01",              // internal record id (string)
  "employeeId": "PF-MGR-00008",    // public, unique, immutable
  "firstName": "Vikram",
  "lastName": "Iyer",
  "email": "vikram.iyer@pratikshyafashon.in",  // unique
  "phone": "+91 98200 22008",      // optional
  "avatar": null,                   // optional URL
  "role": "STORE_MANAGER",          // enum, see §3 — SUPER_ADMIN forbidden
  "department": "MANAGEMENT",       // enum, src/config/employeeDepartments.js
  "section": "STORE_LEADERSHIP",    // enum scoped by department, optional
  "store": "MAIN_FLOOR",            // enum
  "joiningDate": "2023-01-16",      // ISO date
  "status": "ACTIVE",               // ACTIVE | PENDING | ON_LEAVE | SUSPENDED | INACTIVE
  "permissions": ["dashboard.view", "products.view", "..."],
  "permissionMode": "role",         // "role" (defaults) | "custom"
  "mustChangePassword": false,
  "lastLogin": "2026-08-11T09:02:00.000Z",  // nullable
  "createdAt": "2023-01-16T09:00:00.000Z",
  "updatedAt": "2026-08-11T09:02:00.000Z",
  "shift": "Floor lead · 10:00 – 20:00"
}
```

**Never returned:** passwords, credential fingerprints, temporary passwords (except once, in the create/reset response).

## 3. Roles and permissions

Legitimate employee roles (creatable/assignable): `STORE_MANAGER`, `SALES_EXECUTIVE`, `INVENTORY_MANAGER`, `INVENTORY_STAFF`, `WAREHOUSE_STAFF`, `CUSTOMER_SUPPORT`, `FASHION_STYLIST`.

`SUPER_ADMIN` exists **only** in the Admin domain. Any request that would create an employee with it, or convert an employee to it, must fail with `422 ADMIN_ROLE_FORBIDDEN`.

Permission catalogue: `src/config/employeePermissions.js`. Role defaults: `src/config/employeeRoles.js`.

**Admin-only permission keys** — these must never be granted to, or resolve true for, an employee session, even via custom permissions (mirror of `ADMIN_ONLY_PERMISSIONS` in `src/services/employees/authorization.js`):

```
employees.create, employees.edit, employees.suspend,
employees.resetPassword, employees.managePermissions, employees.manage
```

`employees.view` and `team.view` remain legitimate *operational* read permissions (e.g. a Store Manager's read-only team roster).

## 4. Operations

All routes below: **Authorization: Bearer <admin JWT> — SUPER_ADMIN required.**
Every unauthorized call → `401 UNAUTHENTICATED` (no session) or `403 FORBIDDEN` (session is not an Admin-domain SUPER_ADMIN — including *any* employee session).

### 4.1 GET /api/admin/employees — list employees `SUPER_ADMIN required`

Query params (all optional): `query` (matches employeeId, name, email, phone), `role`, `department`, `status`, `store`, plus standard pagination (`page`, `pageSize`).

Response `200`:
```jsonc
{ "employees": [ Employee, ... ], "total": 14 }
```

### 4.2 GET /api/admin/employees/:employeeId — get by ID `SUPER_ADMIN required`

Response `200`: `{ "employee": Employee }`
Errors: `404 NOT_FOUND`.

### 4.3 POST /api/admin/employees — create employee `SUPER_ADMIN required`

Request:
```jsonc
{
  "firstName": "…", "lastName": "…",          // required, non-empty
  "email": "…",                                 // required, valid, unique
  "phone": "…",                                 // optional, valid 10-digit IN mobile
  "role": "SALES_EXECUTIVE",                    // required, employee role only
  "department": "…", "section": "…", "store": "…",  // department+store required
  "joiningDate": "2026-08-14",                  // required
  "status": "PENDING",                          // optional, default PENDING
  "permissionMode": "role" | "custom",
  "permissions": ["…"]                          // only when custom
}
```

Server responsibilities: generate `employeeId`; generate a temporary password; store only a credential hash; set `mustChangePassword: true`.

Response `201`:
```jsonc
{ "employee": Employee, "temporaryPassword": "…" }   // password returned ONCE
```

Validation errors `422` (field-keyed, mirroring `validateEmployeeDraft`):
`firstName/lastName required`, `email invalid/duplicate`, `phone invalid`, `role unknown`, `role = SUPER_ADMIN → ADMIN_ROLE_FORBIDDEN`, `department/store/joiningDate required`, `status unknown`.

### 4.4 PATCH /api/admin/employees/:employeeId — update profile `SUPER_ADMIN required`

Request: any of `firstName, lastName, email, phone, avatar, joiningDate, shift, section`.
`employeeId` and `id` are immutable — reject attempts with `422 IMMUTABLE_FIELD`.

Response `200`: `{ "employee": Employee }`
Errors: `404`, `422` (same validation as create).

> **Employee self-service exception:** an *employee* session may PATCH **only its own** record and **only** the contact fields `phone`, `avatar` (`PATCH /api/employee/profile`). Everything else on this page is admin-only.

### 4.5 PATCH /api/admin/employees/:employeeId/status — activate/deactivate/suspend `SUPER_ADMIN required`

Request: `{ "status": "ACTIVE" | "INACTIVE" | "SUSPENDED" | "ON_LEAVE" | "PENDING" }`

Semantics:
- `INACTIVE` / `SUSPENDED`: authentication refused; excluded from active-assignment selectors; **no historical data deleted** (reviews, activity, assignments stay).
- `ACTIVE`: restores authentication with existing credentials.

Response `200`: `{ "employee": Employee }`
Errors: `404`, `422 UNKNOWN_STATUS`.

### 4.6 PATCH /api/admin/employees/:employeeId/role — change role `SUPER_ADMIN required`

Request: `{ "role": "INVENTORY_STAFF", "keepCustom": false }`

- `keepCustom: false` (default): permissions reset to the new role's defaults, `permissionMode: "role"`.
- `keepCustom: true` and the record was custom: keep the custom set.
- `role = SUPER_ADMIN` → `422 ADMIN_ROLE_FORBIDDEN` (an employee is never converted into an Admin identity).

Response `200`: `{ "employee": Employee }`

### 4.7 PATCH /api/admin/employees/:employeeId/permissions — set custom permissions `SUPER_ADMIN required`

Request: `{ "permissions": ["dashboard.view", "..."] }`
Sets `permissionMode: "custom"`. Reject unknown keys (`422 UNKNOWN_PERMISSION`) and admin-only keys (`422 ADMIN_ONLY_PERMISSION`, see §3).

Response `200`: `{ "employee": Employee }`

### 4.8 POST /api/admin/employees/:employeeId/reset-credentials `SUPER_ADMIN required`

Generates a new temporary password, invalidates the old credential, sets `mustChangePassword: true`, invalidates active employee sessions for that account.

Response `200`:
```jsonc
{ "employee": Employee, "temporaryPassword": "…" }   // returned ONCE, never stored in plain text
```

## 5. Cross-cutting requirements

- **Audit trail:** every operation writes an activity entry `{ at, actorName ("Kavya Menon · PF-ADM-00001"), targetEmployeeId, action, summary }` — same shape as `src/services/employees/activityService.js`. Never log passwords.
- **Login flow (`POST /employee/auth/login`)** must consult `status` (INACTIVE/SUSPENDED → refuse with the status-specific message in `src/config/employeeStatus.js`) and `mustChangePassword` (force `/employee/change-password`).
- **Assignment selectors** (product review, media, order fulfillment) read `GET /api/admin/employees?status=ACTIVE`-style filtered lists — only accounts whose status allows login; never admin identities. Assigning **work** to an employee is an *operational* capability and is separate from *account management*.
- **Deletion:** there is none. Accounts are deactivated, never deleted; history is preserved.

## 6. Error envelope

```jsonc
{ "error": { "code": "FORBIDDEN", "message": "Only a signed-in administrator can manage employee accounts.", "fields": { "email": "…" } } }
```

Codes used above: `UNAUTHENTICATED` (401), `FORBIDDEN` (403), `NOT_FOUND` (404), `VALIDATION` (422 with `fields`), `ADMIN_ROLE_FORBIDDEN` (422), `ADMIN_ONLY_PERMISSION` (422), `UNKNOWN_PERMISSION` (422), `UNKNOWN_STATUS` (422), `IMMUTABLE_FIELD` (422).

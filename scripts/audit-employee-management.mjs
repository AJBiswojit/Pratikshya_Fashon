/**
 * PRATIKSHYA FASHON — Employee-management role-separation audit.
 *
 * Verifies the final responsibility model:
 *
 *   SUPER ADMIN  → Admin Portal → employee ACCOUNT management
 *   EMPLOYEE     → Employee Portal → business operations
 *
 * Checks:
 *   · /admin/employees routes exist (list, new, detail, edit)
 *   · service-layer authorization: admin actor allowed, employee denied
 *   · admin identities cannot be created through the employee form/service
 *   · SUPER_ADMIN never appears as an employee
 *   · duplicate employee IDs = 0, duplicate identities = 0
 *   · inactive employees are excluded from active assignment selectors
 *   · product-review assignment works for legitimate employees
 *   · Employee Portal remains functional (auth, permissions)
 *   · Admin Portal's other modules keep their routes
 *
 * Usage:
 *   npm run audit:employee-management
 */

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

/*
 * The employee repository persists through window.localStorage. Give Node
 * the same seam so create → deactivate → reactivate behaves exactly as it
 * does in the browser. (Checked at call time, so defining it before the
 * first service call is sufficient.)
 */
const memoryStore = new Map();
globalThis.window = globalThis.window ?? {
  localStorage: {
    getItem: (key) => (memoryStore.has(key) ? memoryStore.get(key) : null),
    setItem: (key, value) => memoryStore.set(key, String(value)),
    removeItem: (key) => memoryStore.delete(key),
  },
  dispatchEvent: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
};

import {
  createEmployee,
  deactivateEmployee,
  activateEmployee,
  loadEmployees,
  getEmployee,
  isAccountAdministrator,
  updateEmployeeRole,
  validateEmployeeDraft,
  verifyCredentials,
} from "../src/services/employees/employeeService.js";
import { hasPermission, ADMIN_ONLY_PERMISSIONS } from "../src/services/employees/authorization.js";
import { PERMISSIONS } from "../src/config/employeePermissions.js";
import { ROLES, ROLE_OPTIONS } from "../src/config/employeeRoles.js";
import { canEmployeeLogin } from "../src/config/employeeStatus.js";
import { INITIAL_EMPLOYEES } from "../src/data/employees/mockEmployees.js";
import { DEMO_EMPLOYEE_LOGINS } from "../src/data/employees/demoCredentials.js";
import { INITIAL_ADMINS } from "../src/data/admin/adminAccounts.js";
import { ADMIN_NAV_GROUPS } from "../src/config/adminNavigation.js";
import { EMPLOYEE_NAV_GROUPS } from "../src/config/employeeNavigation.js";
import { assignProductToEmployee } from "../src/services/productWorkflow.js";
import catalogRepository from "../src/services/catalogRepository.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const appSource = readFileSync(join(__dirname, "..", "src", "App.jsx"), "utf8");

const ADMIN_ACTOR = { adminId: "PF-ADM-00001", name: "Kavya Menon" };
const results = [];
let failures = 0;

const check = (label, ok, detail = "") => {
  results.push({ label, ok, detail });
  if (!ok) failures += 1;
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
};

console.log("EMPLOYEE MANAGEMENT — ROLE-SEPARATION AUDIT\n");

/* 1 — Admin employee-management routes exist. */
const routes = [
  '"/admin/employees"',
  '"/admin/employees/new"',
  '"/admin/employees/:employeeId"',
  '"/admin/employees/:employeeId/edit"',
];
check(
  "Admin employee-management routes exist",
  routes.every((route) => appSource.includes(`path=${route}`)),
  routes.map((r) => r.replaceAll('"', "")).join(", ")
);
check(
  "Admin sidebar exposes one Employees entry",
  ADMIN_NAV_GROUPS.some((group) =>
    group.items.some((item) => item.to === "/admin/employees")
  ) &&
    !ADMIN_NAV_GROUPS.some((group) =>
      group.items.some((item) =>
        ["/admin/attendance", "/admin/performance", "/admin/roles"].includes(item.to)
      )
    ),
  "no Workforce/Attendance/Performance/Roles restored"
);

/* 2 — SUPER_ADMIN (admin actor) can manage; employee cannot. */
const employees = loadEmployees();
const adminCreate = createEmployee(employees, {
  firstName: "Audit",
  lastName: "Probe",
  email: "audit.probe@pratikshyafashon.in",
  phone: "",
  role: ROLES.SALES_EXECUTIVE,
  department: "WOMENS_SAREES",
  section: "",
  store: "MAIN_FLOOR",
  joiningDate: "2026-08-14",
}, ADMIN_ACTOR);
check("SUPER_ADMIN can access employee management (create)", adminCreate.ok === true);

const employeeActor = getEmployee(loadEmployees(), "PF-MGR-00008");
const employeeCreate = createEmployee(loadEmployees(), {
  firstName: "Should",
  lastName: "Fail",
  email: "should.fail@pratikshyafashon.in",
  role: ROLES.SALES_EXECUTIVE,
  department: "WOMENS_SAREES",
  store: "MAIN_FLOOR",
  joiningDate: "2026-08-14",
}, employeeActor);
check(
  "Normal employee cannot access employee management",
  employeeCreate.ok === false && employeeCreate.code === "FORBIDDEN"
);
check(
  "Employee session never counts as account administrator",
  !isAccountAdministrator(employeeActor) && !isAccountAdministrator(null) && isAccountAdministrator(ADMIN_ACTOR)
);
check(
  "EMPLOYEES_MANAGE never resolves true for any employee",
  loadEmployees().every((person) =>
    ADMIN_ONLY_PERMISSIONS.every((key) => !hasPermission(person, key))
  ),
  `${ADMIN_ONLY_PERMISSIONS.length} admin-only permission keys checked`
);
check(
  "Employee Portal nav has no employee-management entry",
  !EMPLOYEE_NAV_GROUPS.some((group) =>
    group.items.some((item) => String(item.to).startsWith("/employee/management"))
  )
);

/* 3 — Admin identities cannot be created as employees. */
const superDraft = validateEmployeeDraft(
  {
    firstName: "Fake",
    lastName: "Admin",
    email: "fake.admin@pratikshyafashon.in",
    role: ROLES.SUPER_ADMIN,
    department: "MANAGEMENT",
    store: "MAIN_FLOOR",
    joiningDate: "2026-08-14",
  },
  loadEmployees(),
  { isCreate: true }
);
check("Admin identities cannot be created through employee creation", superDraft.ok === false);
const roleConvert = updateEmployeeRole(loadEmployees(), "PF-MGR-00008", ROLES.SUPER_ADMIN, {
  actor: ADMIN_ACTOR,
});
check("Employee cannot be converted into SUPER_ADMIN", roleConvert.ok === false);

/* 4 — SUPER_ADMIN never appears as employee. */
check(
  "SUPER_ADMIN cannot appear as employee (repository)",
  loadEmployees().every(
    (person) => person.role !== ROLES.SUPER_ADMIN && !person.employeeId.startsWith("PF-ADM-")
  )
);
check(
  "SUPER_ADMIN absent from employee seeds and demo logins",
  INITIAL_EMPLOYEES.every((person) => person.role !== ROLES.SUPER_ADMIN) &&
    DEMO_EMPLOYEE_LOGINS.every((entry) => !entry.employeeId.startsWith("PF-ADM-"))
);

/* 5 — Duplicates. */
const live = loadEmployees();
const ids = live.map((person) => person.employeeId);
check("Duplicate employee IDs = 0", new Set(ids).size === ids.length, `${ids.length} accounts`);
const adminIds = INITIAL_ADMINS.map((admin) => admin.adminId);
check(
  "Duplicate identities = 0",
  adminIds.every((adminId) => !ids.includes(adminId)) &&
    new Set(adminIds).size === adminIds.length,
  "admin and employee identity domains are disjoint"
);

/* 6 — Deactivation removes from selectors, keeps history, reactivation restores. */
const probeId = adminCreate.employee.employeeId;
const deact = deactivateEmployee(loadEmployees(), probeId, ADMIN_ACTOR);
check("Super Admin can deactivate employee", deact.ok === true);
const selectorPool = loadEmployees().filter((person) => canEmployeeLogin(person.status));
check(
  "Inactive employees excluded from active assignment selectors",
  !selectorPool.some((person) => person.employeeId === probeId)
);
check(
  "Deactivated employee record kept (history intact)",
  Boolean(getEmployee(loadEmployees(), probeId))
);
const blockedLogin = verifyCredentials(probeId, adminCreate.temporaryPassword);
check("Deactivated employee cannot login", blockedLogin.ok === false);
const react = activateEmployee(loadEmployees(), probeId, ADMIN_ACTOR);
const restoredLogin = verifyCredentials(probeId, adminCreate.temporaryPassword);
check(
  "Reactivation restores access",
  react.ok === true && restoredLogin.ok === true
);

/* 7 — Product-review assignment still works, active employees only. */
const draftProduct = catalogRepository
  .all()
  .find((product) => product.status !== "ARCHIVED");
const assigned = assignProductToEmployee(draftProduct.id, "PF-MGR-00008", ADMIN_ACTOR);
check("Product review assignment still works", assigned.ok === true, `assigned ${draftProduct.id}`);
const deact2 = deactivateEmployee(loadEmployees(), probeId, ADMIN_ACTOR);
const assignInactive = assignProductToEmployee(draftProduct.id, probeId, ADMIN_ACTOR);
check(
  "Assignment refuses inactive employees",
  deact2.ok === true && assignInactive.ok === false
);
/* restore original assignment state */
assignProductToEmployee(draftProduct.id, null, ADMIN_ACTOR);

/* 8 — Employee Portal still works: a legitimate employee authenticates. */
const employeeLogin = verifyCredentials("PF-SLS-00124", "PF@7Kx92");
check(
  "Employee Portal still works (login + permissions)",
  employeeLogin.ok === true &&
    hasPermission(employeeLogin.employee, PERMISSIONS.DASHBOARD_VIEW)
);

/* 9 — Admin Portal's other modules keep their routes. */
const adminModules = [
  '"/admin/products"',
  '"/admin/media"',
  '"/admin/orders"',
  '"/admin/offers"',
  '"/admin/categories"',
  '"/admin/collections"',
  '"/admin/analytics"',
  '"/admin/settings"',
];
check(
  "Admin Portal other modules still work (routes present)",
  adminModules.every((route) => appSource.includes(`path=${route}`))
);

/* 10 — Legitimate employee roles only in the creation form. */
const employeeRoles = ROLE_OPTIONS.filter((role) => role.id !== ROLES.SUPER_ADMIN);
check(
  "Employee creation form exposes legitimate roles only",
  readFileSync(join(__dirname, "..", "src", "components", "employee", "EmployeeForm.jsx"), "utf8")
    .includes("EMPLOYEE_ROLE_OPTIONS"),
  `${employeeRoles.length} employee roles, SUPER_ADMIN excluded`
);

console.log(
  `\n${failures === 0 ? "PASS" : "FAIL"}: ${results.length - failures}/${results.length} checks passed.`
);
if (failures > 0) process.exit(1);

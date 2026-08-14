/**
 * PRATIKSHYA FASHON — Employee-account management regression tests.
 *
 * The final responsibility model under test:
 *
 *   SUPER ADMIN  → Admin Portal → employee ACCOUNT management
 *   EMPLOYEE     → Employee Portal → business operations
 *
 * Authorization is asserted at the SERVICE layer — the seam a future
 * backend will implement — never at the React layer alone.
 */

import test from "node:test";
import assert from "node:assert/strict";

/* Browser storage seam for Node (checked at call time by readStorage). */
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
  activateEmployee,
  createEmployee,
  deactivateEmployee,
  getEmployee,
  isAccountAdministrator,
  loadEmployees,
  resetEmployeePassword,
  suspendEmployee,
  updateEmployee,
  updateEmployeePermissions,
  updateEmployeeRole,
  validateEmployeeDraft,
  verifyCredentials,
} from "../src/services/employees/employeeService.js";
import {
  ADMIN_ONLY_PERMISSIONS,
  hasPermission,
} from "../src/services/employees/authorization.js";
import { PERMISSIONS } from "../src/config/employeePermissions.js";
import { ROLES } from "../src/config/employeeRoles.js";
import { EMPLOYEE_STATUS, canEmployeeLogin } from "../src/config/employeeStatus.js";
import { INITIAL_EMPLOYEES } from "../src/data/employees/mockEmployees.js";
import { DEMO_EMPLOYEE_LOGINS } from "../src/data/employees/demoCredentials.js";
import { INITIAL_ADMINS } from "../src/data/admin/adminAccounts.js";
import { assignProductToEmployee } from "../src/services/productWorkflow.js";
import catalogRepository from "../src/services/catalogRepository.js";

const SUPER_ADMIN = { adminId: "PF-ADM-00001", name: "Kavya Menon" };
const MANAGER_ID = "PF-MGR-00008";

const employeeActor = () => getEmployee(loadEmployees(), MANAGER_ID);

let draftSeq = 0;
const draft = (overrides = {}) => ({
  firstName: "Test",
  lastName: "Colleague",
  email: `test.colleague.${Date.now().toString(36)}.${(draftSeq += 1)}@pratikshyafashon.in`,
  phone: "",
  role: ROLES.SALES_EXECUTIVE,
  department: "WOMENS_SAREES",
  section: "",
  store: "MAIN_FLOOR",
  joiningDate: "2026-08-14",
  ...overrides,
});

/* ------------------------------------------------------------------ */
/* 1–2. Access: Super Admin allowed, employee denied                   */
/* ------------------------------------------------------------------ */

test("1. Super Admin can access employee management (service accepts admin actor)", () => {
  assert.equal(isAccountAdministrator(SUPER_ADMIN), true);
  const created = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  assert.equal(created.ok, true);
  assert.ok(created.employee.employeeId.startsWith("PF-"));
  /* clean up for later counts */
  deactivateEmployee(loadEmployees(), created.employee.employeeId, SUPER_ADMIN);
});

test("2. Normal employee cannot access employee management", () => {
  const actor = employeeActor();
  assert.equal(isAccountAdministrator(actor), false);

  const created = createEmployee(loadEmployees(), draft(), actor);
  assert.equal(created.ok, false);
  assert.equal(created.code, "FORBIDDEN");

  const roleChange = updateEmployeeRole(loadEmployees(), "PF-SLS-00124", ROLES.STORE_MANAGER, {
    actor,
  });
  assert.equal(roleChange.ok, false);

  const permChange = updateEmployeePermissions(
    loadEmployees(),
    "PF-SLS-00124",
    [PERMISSIONS.DASHBOARD_VIEW],
    actor
  );
  assert.equal(permChange.ok, false);

  const statusChange = suspendEmployee(loadEmployees(), "PF-SLS-00124", actor);
  assert.equal(statusChange.ok, false);

  const reset = resetEmployeePassword(loadEmployees(), "PF-SLS-00124", actor);
  assert.equal(reset.ok, false);

  const otherEdit = updateEmployee(
    loadEmployees(),
    "PF-SLS-00124",
    { firstName: "Hijacked" },
    actor
  );
  assert.equal(otherEdit.ok, false, "an employee cannot edit another employee's record");

  /* EMPLOYEES_MANAGE and friends never resolve true through employee auth. */
  ADMIN_ONLY_PERMISSIONS.forEach((key) => {
    assert.equal(hasPermission(actor, key), false, `${key} must be admin-only`);
  });
});

test("2b. Employee self-service contact edit still works (not account management)", () => {
  const actor = employeeActor();
  const result = updateEmployee(
    loadEmployees(),
    MANAGER_ID,
    { phone: "+91 98200 22008" },
    actor
  );
  assert.equal(result.ok, true, "own contact details remain editable");
  const escalation = updateEmployee(
    loadEmployees(),
    MANAGER_ID,
    { role: ROLES.SUPER_ADMIN },
    actor
  );
  assert.equal(escalation.ok, false, "self-edit cannot touch role");
});

/* ------------------------------------------------------------------ */
/* 3–5. Creation, ID uniqueness, admin-role rejection                  */
/* ------------------------------------------------------------------ */

test("3. Super Admin can create an employee (credentials issued, usable)", () => {
  const created = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  assert.equal(created.ok, true);
  assert.ok(created.temporaryPassword, "a temporary password is issued");
  const login = verifyCredentials(created.employee.employeeId, created.temporaryPassword);
  assert.equal(login.ok, true, "the new account can authenticate immediately");
  assert.equal(login.employee.mustChangePassword, true);
});

test("4. Employee IDs remain unique and deterministic in format", () => {
  const first = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  const second = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  assert.equal(first.ok, true);
  assert.equal(second.ok, true);
  assert.notEqual(first.employee.employeeId, second.employee.employeeId);

  const ids = loadEmployees().map((person) => person.employeeId);
  assert.equal(new Set(ids).size, ids.length, "no duplicate employee IDs");
  ids.forEach((id) => assert.match(id, /^PF-[A-Z]{2,3}-\d{5}$/));
});

test("5. Admin roles cannot be created through the employee form/service", () => {
  const validation = validateEmployeeDraft(
    draft({ role: ROLES.SUPER_ADMIN }),
    loadEmployees(),
    { isCreate: true }
  );
  assert.equal(validation.ok, false);
  assert.ok(validation.errors.role, "the role field carries the rejection");

  const created = createEmployee(
    loadEmployees(),
    draft({ role: ROLES.SUPER_ADMIN }),
    SUPER_ADMIN
  );
  assert.equal(created.ok, false, "even an admin cannot seed an admin identity as employee");
});

/* ------------------------------------------------------------------ */
/* 6–10. Edit, deactivate, login block, selectors, reactivate          */
/* ------------------------------------------------------------------ */

test("6. Super Admin can edit an employee", () => {
  const created = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  const edited = updateEmployee(
    loadEmployees(),
    created.employee.employeeId,
    { firstName: "Edited" },
    SUPER_ADMIN
  );
  assert.equal(edited.ok, true);
  assert.equal(edited.employee.firstName, "Edited");

  const roleChange = updateEmployeeRole(
    loadEmployees(),
    created.employee.employeeId,
    ROLES.INVENTORY_STAFF,
    { actor: SUPER_ADMIN }
  );
  assert.equal(roleChange.ok, true);
  assert.equal(roleChange.employee.role, ROLES.INVENTORY_STAFF);

  const toAdmin = updateEmployeeRole(
    loadEmployees(),
    created.employee.employeeId,
    ROLES.SUPER_ADMIN,
    { actor: SUPER_ADMIN }
  );
  assert.equal(toAdmin.ok, false, "an employee can never become SUPER_ADMIN");
});

test("7–10. Deactivate blocks login and selectors; reactivate restores; history kept", () => {
  const created = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  const { employeeId } = created.employee;

  /* 7. Deactivate */
  const deactivated = deactivateEmployee(loadEmployees(), employeeId, SUPER_ADMIN);
  assert.equal(deactivated.ok, true);
  assert.equal(deactivated.employee.status, EMPLOYEE_STATUS.INACTIVE);

  /* 8. Deactivated employee cannot login */
  const blocked = verifyCredentials(employeeId, created.temporaryPassword);
  assert.equal(blocked.ok, false);

  /* 9. Disappears from active assignment selectors */
  const selectorPool = loadEmployees().filter((person) => canEmployeeLogin(person.status));
  assert.ok(!selectorPool.some((person) => person.employeeId === employeeId));

  /* record — history — remains intact */
  assert.ok(getEmployee(loadEmployees(), employeeId), "record survives deactivation");

  /* 10. Reactivation restores access */
  const reactivated = activateEmployee(loadEmployees(), employeeId, SUPER_ADMIN);
  assert.equal(reactivated.ok, true);
  const restored = verifyCredentials(employeeId, created.temporaryPassword);
  assert.equal(restored.ok, true);
});

/* ------------------------------------------------------------------ */
/* 11–15. Data integrity, assignment, identity domains, portal          */
/* ------------------------------------------------------------------ */

test("11. Existing employee records remain intact (seeds unchanged)", () => {
  const live = loadEmployees();
  INITIAL_EMPLOYEES.forEach((seed) => {
    const found = live.find((person) => person.employeeId === seed.employeeId);
    assert.ok(found, `${seed.employeeId} still present`);
    assert.equal(found.role, seed.role, `${seed.employeeId} role not silently changed`);
    assert.equal(found.email, seed.email);
  });
});

test("12. Product Review assignment still works (active employees only)", () => {
  const product = catalogRepository.all().find((item) => item.status !== "ARCHIVED");
  const previous = product.assignedEmployeeId ?? null;

  const assigned = assignProductToEmployee(product.id, MANAGER_ID, SUPER_ADMIN);
  assert.equal(assigned.ok, true);
  assert.equal(assigned.product.assignedEmployeeId, MANAGER_ID);

  /* an inactive account is refused by the same seam */
  const probe = createEmployee(loadEmployees(), draft(), SUPER_ADMIN);
  deactivateEmployee(loadEmployees(), probe.employee.employeeId, SUPER_ADMIN);
  const refused = assignProductToEmployee(product.id, probe.employee.employeeId, SUPER_ADMIN);
  assert.equal(refused.ok, false);

  /* restore the original assignment state */
  assignProductToEmployee(product.id, previous, SUPER_ADMIN);
});

test("13. Admin identity remains Admin-only (Kavya Menon · PF-ADM-00001)", () => {
  assert.equal(INITIAL_ADMINS.length, 1);
  assert.equal(INITIAL_ADMINS[0].adminId, "PF-ADM-00001");
  assert.equal(INITIAL_ADMINS[0].name, "Kavya Menon");
  assert.equal(INITIAL_ADMINS[0].role, "SUPER_ADMIN");

  const live = loadEmployees();
  assert.ok(
    live.every(
      (person) =>
        person.role !== ROLES.SUPER_ADMIN && !person.employeeId.startsWith("PF-ADM-")
    ),
    "no admin identity inside the employee repository"
  );
  assert.ok(
    DEMO_EMPLOYEE_LOGINS.every((entry) => !entry.employeeId.startsWith("PF-ADM-")),
    "no admin identity in employee demo logins"
  );
});

test("14. No duplicate identity is created across the two domains", () => {
  const employeeIds = loadEmployees().map((person) => person.employeeId);
  const adminIds = INITIAL_ADMINS.map((admin) => admin.adminId);
  assert.equal(new Set(employeeIds).size, employeeIds.length);
  adminIds.forEach((adminId) => {
    assert.ok(!employeeIds.includes(adminId), `${adminId} exists only as an Admin`);
  });
});

test("15. Employee Portal remains functional (login, permissions, operations)", () => {
  const login = verifyCredentials("PF-SLS-00124", "PF@7Kx92");
  assert.equal(login.ok, true, "Ananya Sharma signs in");
  assert.equal(hasPermission(login.employee, PERMISSIONS.DASHBOARD_VIEW), true);
  assert.equal(hasPermission(login.employee, PERMISSIONS.PRODUCTS_VIEW), true);
  /* …but never account administration. */
  assert.equal(hasPermission(login.employee, PERMISSIONS.EMPLOYEES_MANAGE), false);

  const manager = verifyCredentials("PF-MGR-00008", "PF@Mgr4N");
  assert.equal(manager.ok, true, "Vikram Iyer signs in");
  assert.equal(hasPermission(manager.employee, PERMISSIONS.EMPLOYEES_VIEW), true, "read-only team view is operational, not administration");
  assert.equal(hasPermission(manager.employee, PERMISSIONS.EMPLOYEES_MANAGE), false);
});

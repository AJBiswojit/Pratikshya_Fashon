/**
 * PRATIKSHYA FASHON — Employee management service.
 *
 * The seam the future Admin Portal will consume:
 *
 *   EmployeeManagementContext → employeeService → mock storage   (now)
 *   Admin Portal              → employeeService → employee API   (later)
 *
 * Credentials are isolated from the profile. Passwords are never written
 * onto the employee record and are never returned by list/get methods.
 */

import { ROLES, getDefaultPermissions, isKnownRole } from "../../config/employeeRoles";
import {
  EMPLOYEE_STATUS,
  canEmployeeLogin,
  getEmployeeStatus,
} from "../../config/employeeStatus";
import { INITIAL_EMPLOYEES } from "../../data/employees/mockEmployees";
import { DEMO_EMPLOYEE_LOGINS } from "../../data/employees/demoCredentials";
import { isValidEmail, isValidPhone } from "../../utils/validation";
import { readStorage, writeStorage } from "../../utils/shopping";
import { employeeFullName } from "../../utils/employee";
import { EMPLOYEE_STORAGE_KEYS } from "./storage";
import { generateEmployeeId, isValidEmployeeId, normaliseEmployeeId } from "./employeeId";
import {
  generateTemporaryPassword,
  mockCredentialFingerprint,
  validateEmployeePassword,
} from "./employeePassword";

/* ------------------------------------------------------------------ */
/* Account authority — SUPER ADMIN manages employee accounts.          */
/* ------------------------------------------------------------------ */

/**
 * An account-administration actor must belong to the ADMIN identity
 * domain (an `adminId`, issued by /admin/login). An employee session —
 * any employee session, whatever its permissions claim — is never an
 * account administrator. This is the service-layer guard the UI cannot
 * bypass.
 */
export const isAccountAdministrator = (actor) =>
  Boolean(actor && actor.adminId) && !actor.employeeId;

const FORBIDDEN = {
  ok: false,
  code: "FORBIDDEN",
  message: "Only a signed-in administrator can manage employee accounts.",
};

const forbidden = (extra = {}) => ({ ...FORBIDDEN, errors: {}, ...extra });

/** Contact fields an employee may edit on their OWN profile. */
const SELF_EDITABLE_FIELDS = ["phone", "avatar"];

const isSelfContactPatch = (actor, target, patch) =>
  Boolean(actor?.employeeId) &&
  Boolean(target?.employeeId) &&
  actor.employeeId === target.employeeId &&
  Object.keys(patch || {}).every((key) => SELF_EDITABLE_FIELDS.includes(key));

const PROFILE_FIELDS = [
  "id",
  "employeeId",
  "firstName",
  "lastName",
  "email",
  "phone",
  "avatar",
  "role",
  "department",
  "section",
  "store",
  "joiningDate",
  "status",
  "permissions",
  "permissionMode",
  "mustChangePassword",
  "lastLogin",
  "createdAt",
  "shift",
];

const stripUnknown = (record) => {
  if (!record || typeof record !== "object") return null;
  const next = {};
  PROFILE_FIELDS.forEach((field) => {
    if (field in record) next[field] = record[field];
  });
  return next;
};

export const toPublicEmployee = (record) => {
  const cleaned = stripUnknown(record);
  if (!cleaned || !cleaned.employeeId) return null;

  const permissionMode = cleaned.permissionMode === "custom" ? "custom" : "role";
  let permissions;
  if (cleaned.role === ROLES.SUPER_ADMIN) {
    permissions = getDefaultPermissions(ROLES.SUPER_ADMIN);
  } else if (permissionMode === "role") {
    permissions = getDefaultPermissions(cleaned.role);
  } else {
    permissions = Array.isArray(cleaned.permissions)
      ? [...cleaned.permissions]
      : getDefaultPermissions(cleaned.role);
  }

  return {
    id: String(cleaned.id || cleaned.employeeId),
    employeeId: normaliseEmployeeId(cleaned.employeeId),
    firstName: String(cleaned.firstName || "").trim(),
    lastName: String(cleaned.lastName || "").trim(),
    email: String(cleaned.email || "").trim().toLowerCase(),
    phone: String(cleaned.phone || "").trim(),
    avatar: cleaned.avatar || null,
    role: cleaned.role,
    department: cleaned.department,
    section: cleaned.section || "",
    store: cleaned.store || "",
    joiningDate: cleaned.joiningDate || "",
    status: cleaned.status || EMPLOYEE_STATUS.PENDING,
    permissions,
    permissionMode,
    mustChangePassword: Boolean(cleaned.mustChangePassword),
    lastLogin: cleaned.lastLogin || null,
    createdAt: cleaned.createdAt || new Date().toISOString(),
    shift: cleaned.shift || "Morning · 10:00 – 19:00",
  };
};

/**
 * Admin/Employee boundary — the employee repository holds employees only.
 * Admin identities (SUPER_ADMIN, PF-ADM-…) live in the isolated admin
 * account store and authenticate at /admin/login. Any admin record found
 * in employee storage (e.g. from an older seed) is dropped on read, so an
 * admin can never appear in the Employee Directory, demo logins or any
 * employee selector.
 */
const isAdminIdentity = (employee) =>
  employee?.role === ROLES.SUPER_ADMIN ||
  String(employee?.employeeId || "").startsWith("PF-ADM-");

export const normaliseEmployees = (raw) => {
  if (!Array.isArray(raw)) return [];
  const seen = new Set();
  const list = [];
  raw.forEach((entry) => {
    const employee = toPublicEmployee(entry);
    if (!employee || seen.has(employee.employeeId)) return;
    if (isAdminIdentity(employee)) return;
    if ("password" in (entry || {}) || "temporaryPassword" in (entry || {})) {
      // Drop any leaked credential fields from corrupt storage.
    }
    seen.add(employee.employeeId);
    list.push(employee);
  });
  return list;
};

const seedCredentials = () => {
  const map = {};
  DEMO_EMPLOYEE_LOGINS.forEach((entry) => {
    map[entry.employeeId] = {
      employeeId: entry.employeeId,
      fingerprint: mockCredentialFingerprint(entry.employeeId, entry.password),
      mustChangePassword: entry.employeeId === "PF-SLS-00155",
      updatedAt: "2026-08-08T11:00:00.000Z",
    };
  });
  return map;
};

export const loadEmployees = () => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.EMPLOYEES, null);
  const normalised = normaliseEmployees(stored);
  if (normalised.length > 0) return normalised;
  const seeded = normaliseEmployees(INITIAL_EMPLOYEES);
  writeStorage(EMPLOYEE_STORAGE_KEYS.EMPLOYEES, seeded);
  return seeded;
};

export const saveEmployees = (employees) => {
  writeStorage(EMPLOYEE_STORAGE_KEYS.EMPLOYEES, normaliseEmployees(employees));
};

export const loadCredentials = () => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.CREDENTIALS, null);
  if (stored && typeof stored === "object" && !Array.isArray(stored)) {
    return stored;
  }
  const seeded = seedCredentials();
  writeStorage(EMPLOYEE_STORAGE_KEYS.CREDENTIALS, seeded);
  return seeded;
};

export const saveCredentials = (map) => {
  writeStorage(EMPLOYEE_STORAGE_KEYS.CREDENTIALS, map && typeof map === "object" ? map : {});
};

export const getEmployees = (employees, filters = {}) => {
  const list = Array.isArray(employees) ? employees : [];
  return list.filter((employee) => {
    if (filters.role && employee.role !== filters.role) return false;
    if (filters.department && employee.department !== filters.department) return false;
    if (filters.status && employee.status !== filters.status) return false;
    if (filters.store && employee.store !== filters.store) return false;
    if (filters.query) {
      const haystack = [
        employee.employeeId,
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.phone,
      ]
        .join(" ")
        .toLowerCase();
      if (!haystack.includes(String(filters.query).trim().toLowerCase())) return false;
    }
    return true;
  });
};

export const getEmployee = (employees, idOrEmployeeId) => {
  if (!idOrEmployeeId) return null;
  const needle = String(idOrEmployeeId).trim();
  const upper = needle.toUpperCase();
  return (
    employees.find(
      (employee) => employee.id === needle || employee.employeeId === upper
    ) ?? null
  );
};

const replaceEmployee = (employees, next) =>
  employees.map((employee) => (employee.id === next.id ? next : employee));

export const validateEmployeeDraft = (draft, employees, { isCreate = false } = {}) => {
  const errors = {};
  const firstName = String(draft.firstName || "").trim();
  const lastName = String(draft.lastName || "").trim();
  const email = String(draft.email || "").trim().toLowerCase();
  const phone = String(draft.phone || "").trim();

  if (!firstName) errors.firstName = "First name is required.";
  if (!lastName) errors.lastName = "Last name is required.";
  if (!email) errors.email = "Email is required.";
  else if (!isValidEmail(email)) errors.email = "Please enter a valid email address.";
  if (phone && !isValidPhone(phone)) errors.phone = "Please enter a valid 10-digit mobile number.";
  if (!draft.role || !isKnownRole(draft.role)) errors.role = "Please choose a role.";
  else if (draft.role === ROLES.SUPER_ADMIN) {
    // Admin identities live in the admin account store only.
    errors.role = "Admin identities are not employee accounts.";
  }
  if (!draft.department) errors.department = "Please choose a department.";
  if (!draft.store) errors.store = "Please choose a store or floor.";
  if (!draft.joiningDate) errors.joiningDate = "Joining date is required.";
  if (draft.status && !getEmployeeStatus(draft.status).id) {
    errors.status = "Please choose a valid status.";
  }

  const duplicate = employees.find((employee) => {
    if (!isCreate && (employee.id === draft.id || employee.employeeId === draft.employeeId)) {
      return false;
    }
    return employee.email === email;
  });
  if (duplicate) errors.email = "An employee with this email already exists.";

  return { ok: Object.keys(errors).length === 0, errors };
};

export const createEmployee = (employees, draft, actor = null) => {
  /* Service-layer authorization: employee accounts are created by a
     signed-in administrator only. UI checks are a courtesy; this is law. */
  if (!isAccountAdministrator(actor)) {
    return forbidden({ employee: null, temporaryPassword: null });
  }
  const validation = validateEmployeeDraft(draft, employees, { isCreate: true });
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, employee: null, temporaryPassword: null };
  }

  const existingIds = employees.map((employee) => employee.employeeId);
  const employeeId = generateEmployeeId({
    role: draft.role,
    department: draft.department,
    existingIds,
  });

  if (!isValidEmployeeId(employeeId) || existingIds.includes(employeeId)) {
    return {
      ok: false,
      errors: { employeeId: "Could not generate a unique employee ID." },
      employee: null,
      temporaryPassword: null,
    };
  }

  const permissionMode = draft.permissionMode === "custom" ? "custom" : "role";
  const permissions =
    permissionMode === "custom" && Array.isArray(draft.permissions)
      ? [...draft.permissions]
      : getDefaultPermissions(draft.role);

  const now = new Date().toISOString();
  const employee = toPublicEmployee({
    id: `emp-${Date.now().toString(36)}`,
    employeeId,
    firstName: draft.firstName.trim(),
    lastName: draft.lastName.trim(),
    email: draft.email.trim().toLowerCase(),
    phone: draft.phone?.trim() || "",
    avatar: null,
    role: draft.role,
    department: draft.department,
    section: draft.section || "",
    store: draft.store,
    joiningDate: draft.joiningDate,
    status: draft.status || EMPLOYEE_STATUS.PENDING,
    permissions,
    permissionMode,
    mustChangePassword: true,
    lastLogin: null,
    createdAt: now,
    shift: draft.shift || "Morning · 10:00 – 19:00",
  });

  const temporaryPassword = generateTemporaryPassword();
  const credentials = loadCredentials();
  credentials[employee.employeeId] = {
    employeeId: employee.employeeId,
    fingerprint: mockCredentialFingerprint(employee.employeeId, temporaryPassword),
    mustChangePassword: true,
    updatedAt: now,
  };
  saveCredentials(credentials);

  const nextEmployees = [employee, ...employees];
  saveEmployees(nextEmployees);

  return {
    ok: true,
    errors: {},
    employee,
    temporaryPassword,
    employees: nextEmployees,
    actor,
    message: `${employeeFullName(employee)} has been added to the house.`,
  };
};

export const updateEmployee = (employees, employeeId, patch, actor = null) => {
  const current = getEmployee(employees, employeeId);
  if (!current) {
    return { ok: false, message: "Employee not found.", employee: null, employees };
  }

  /* Administrators edit any account. An employee may only touch the
     contact fields of their OWN profile — never role, permissions,
     status or anyone else's record. */
  if (!isAccountAdministrator(actor) && !isSelfContactPatch(actor, current, patch)) {
    return forbidden({ employee: current, employees });
  }

  const merged = { ...current, ...patch, employeeId: current.employeeId, id: current.id };
  const validation = validateEmployeeDraft(merged, employees, { isCreate: false });
  if (!validation.ok) {
    return { ok: false, errors: validation.errors, employee: current, employees };
  }

  const next = toPublicEmployee(merged);
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, errors: {}, employee: next, employees: nextEmployees };
};

export const updateEmployeeRole = (
  employees,
  employeeId,
  role,
  { keepCustom = false, actor = null } = {}
) => {
  if (!isAccountAdministrator(actor)) return forbidden({ employees });
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, message: "Employee not found.", employees };
  if (!isKnownRole(role)) return { ok: false, message: "That role is not recognised.", employees };
  if (role === ROLES.SUPER_ADMIN) {
    return {
      ok: false,
      message: "Admin identities live in the Admin domain — an employee cannot be converted into one.",
      employees,
    };
  }

  const keep = keepCustom && current.permissionMode === "custom";
  const next = toPublicEmployee({
    ...current,
    role,
    permissionMode: keep ? "custom" : "role",
    permissions: keep ? current.permissions : getDefaultPermissions(role),
  });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const updateEmployeeDepartment = (
  employees,
  employeeId,
  { department, section, store },
  actor = null
) => {
  if (!isAccountAdministrator(actor)) return forbidden({ employees });
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, message: "Employee not found.", employees };
  const next = toPublicEmployee({
    ...current,
    department: department ?? current.department,
    section: section ?? current.section,
    store: store ?? current.store,
  });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const updateEmployeePermissions = (employees, employeeId, permissions, actor = null) => {
  if (!isAccountAdministrator(actor)) return forbidden({ employees });
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, message: "Employee not found.", employees };
  const next = toPublicEmployee({
    ...current,
    permissions: Array.isArray(permissions) ? permissions : current.permissions,
    permissionMode: "custom",
  });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const setEmployeeStatus = (employees, employeeId, status, actor = null) => {
  if (!isAccountAdministrator(actor)) return forbidden({ employees });
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, message: "Employee not found.", employees };
  if (!getEmployeeStatus(status).id) {
    return { ok: false, message: "That status is not recognised.", employees };
  }
  const next = toPublicEmployee({ ...current, status });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const suspendEmployee = (employees, employeeId, actor = null) =>
  setEmployeeStatus(employees, employeeId, EMPLOYEE_STATUS.SUSPENDED, actor);

export const activateEmployee = (employees, employeeId, actor = null) =>
  setEmployeeStatus(employees, employeeId, EMPLOYEE_STATUS.ACTIVE, actor);

export const deactivateEmployee = (employees, employeeId, actor = null) =>
  setEmployeeStatus(employees, employeeId, EMPLOYEE_STATUS.INACTIVE, actor);

export const resetEmployeePassword = (employees, employeeId, actor = null) => {
  if (!isAccountAdministrator(actor)) {
    return forbidden({ temporaryPassword: null, employees });
  }
  const current = getEmployee(employees, employeeId);
  if (!current) {
    return { ok: false, message: "Employee not found.", temporaryPassword: null, employees };
  }
  const temporaryPassword = generateTemporaryPassword();
  const now = new Date().toISOString();
  const credentials = loadCredentials();
  credentials[current.employeeId] = {
    employeeId: current.employeeId,
    fingerprint: mockCredentialFingerprint(current.employeeId, temporaryPassword),
    mustChangePassword: true,
    updatedAt: now,
  };
  saveCredentials(credentials);

  const next = toPublicEmployee({ ...current, mustChangePassword: true });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);

  return {
    ok: true,
    employee: next,
    employees: nextEmployees,
    temporaryPassword,
    message: "A new temporary password has been generated. This is a DEMO credential.",
  };
};

export const markLastLogin = (employees, employeeId, at = new Date().toISOString()) => {
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, employees };
  const next = toPublicEmployee({ ...current, lastLogin: at });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const applyPasswordChange = (employees, employeeId, { currentPassword, newPassword }) => {
  const current = getEmployee(employees, employeeId);
  if (!current) return { ok: false, message: "Employee not found." };

  const credentials = loadCredentials();
  const record = credentials[current.employeeId];
  if (!record) return { ok: false, message: "Credentials could not be verified." };

  const expected = mockCredentialFingerprint(current.employeeId, currentPassword);
  if (record.fingerprint !== expected) {
    return { ok: false, message: "Current password is not correct." };
  }

  const strength = validateEmployeePassword(newPassword);
  if (!strength.ok) return strength;

  credentials[current.employeeId] = {
    employeeId: current.employeeId,
    fingerprint: mockCredentialFingerprint(current.employeeId, newPassword),
    mustChangePassword: false,
    updatedAt: new Date().toISOString(),
  };
  saveCredentials(credentials);

  const next = toPublicEmployee({
    ...current,
    mustChangePassword: false,
    status:
      current.status === EMPLOYEE_STATUS.PENDING ? EMPLOYEE_STATUS.ACTIVE : current.status,
  });
  const nextEmployees = replaceEmployee(employees, next);
  saveEmployees(nextEmployees);
  return { ok: true, employee: next, employees: nextEmployees };
};

export const verifyCredentials = (employeeId, password) => {
  const id = normaliseEmployeeId(employeeId);
  if (!id || !password) {
    return { ok: false, code: "INVALID", message: "Enter your employee ID and password." };
  }
  if (!isValidEmployeeId(id)) {
    return { ok: false, code: "INVALID_ID", message: "That employee ID does not look right." };
  }

  const employees = loadEmployees();
  const employee = getEmployee(employees, id);
  if (!employee) {
    return {
      ok: false,
      code: "UNKNOWN",
      message: "That employee ID does not match our records.",
    };
  }

  if (!canEmployeeLogin(employee.status)) {
    const blocked = getEmployeeStatus(employee.status);
    return {
      ok: false,
      code: employee.status,
      message: blocked.loginBlockedMessage,
      employee,
    };
  }

  if (!isKnownRole(employee.role)) {
    return {
      ok: false,
      code: "MISSING_ROLE",
      message: "This account has no assigned role. Please contact your administrator.",
      employee,
    };
  }

  const credentials = loadCredentials();
  const record = credentials[employee.employeeId];
  if (!record) {
    return {
      ok: false,
      code: "NO_CREDENTIALS",
      message: "This account has no credentials issued. Please contact your administrator.",
    };
  }

  const fingerprint = mockCredentialFingerprint(employee.employeeId, password);
  if (record.fingerprint !== fingerprint) {
    return { ok: false, code: "INVALID", message: "Employee ID or password is not correct." };
  }

  return {
    ok: true,
    employee: toPublicEmployee({
      ...employee,
      mustChangePassword: Boolean(record.mustChangePassword || employee.mustChangePassword),
    }),
  };
};

export const ensureSeeded = () => {
  const employees = loadEmployees();
  loadCredentials();
  return employees;
};

export default {
  isAccountAdministrator,
  toPublicEmployee,
  normaliseEmployees,
  loadEmployees,
  saveEmployees,
  loadCredentials,
  saveCredentials,
  getEmployees,
  getEmployee,
  validateEmployeeDraft,
  createEmployee,
  updateEmployee,
  updateEmployeeRole,
  updateEmployeeDepartment,
  updateEmployeePermissions,
  setEmployeeStatus,
  suspendEmployee,
  activateEmployee,
  deactivateEmployee,
  resetEmployeePassword,
  markLastLogin,
  applyPasswordChange,
  verifyCredentials,
  ensureSeeded,
};

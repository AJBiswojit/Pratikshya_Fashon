/**
 * PRATIKSHYA FASHON — Employee authorization.
 *
 * role → permissions → authorization
 *
 * Pages ask `hasPermission("inventory.view")`. They never test
 * `role === "sales"`. A missing role or empty permission list is a
 * deny, not an allow.
 */

import { canEmployeeLogin } from "../../config/employeeStatus";
import { ROLES, isKnownRole } from "../../config/employeeRoles";
import { PERMISSIONS } from "../../config/employeePermissions";
import { requiredPermissionForPath } from "../../config/employeeNavigation";

/**
 * Employee-account administration is an ADMIN capability, never an employee
 * one. These permission keys exist in the catalogue for the Admin Portal's
 * benefit, but `hasPermission` refuses them for every employee — an
 * employee cannot hold them via role defaults, custom grants or corrupt
 * storage. The Employee Portal can therefore never become a backdoor to
 * employee administration.
 */
export const ADMIN_ONLY_PERMISSIONS = Object.freeze([
  PERMISSIONS.EMPLOYEES_CREATE,
  PERMISSIONS.EMPLOYEES_EDIT,
  PERMISSIONS.EMPLOYEES_SUSPEND,
  PERMISSIONS.EMPLOYEES_RESET_PASSWORD,
  PERMISSIONS.EMPLOYEES_MANAGE_PERMISSIONS,
  PERMISSIONS.EMPLOYEES_MANAGE,
]);

const ADMIN_ONLY_PERMISSION_SET = new Set(ADMIN_ONLY_PERMISSIONS);

export const hasPermission = (employee, permission) => {
  if (!employee || !permission) return false;
  if (!canEmployeeLogin(employee.status)) return false;
  /* Employee-account management never resolves through employee auth. */
  if (ADMIN_ONLY_PERMISSION_SET.has(permission)) return false;
  if (employee.role === ROLES.SUPER_ADMIN) return true;
  if (!Array.isArray(employee.permissions)) return false;
  if (employee.permissions.includes(permission)) return true;
  /* offers.manage is the house-wide offer desk and implies every offer key. */
  if (
    String(permission).startsWith("offers.") &&
    permission !== PERMISSIONS.OFFERS_MANAGE &&
    employee.permissions.includes(PERMISSIONS.OFFERS_MANAGE)
  ) {
    return true;
  }
  if (
    String(permission).startsWith("attendance.") &&
    permission !== PERMISSIONS.ATTENDANCE_MANAGE &&
    employee.permissions.includes(PERMISSIONS.ATTENDANCE_MANAGE)
  ) {
    return true;
  }
  if (
    String(permission).startsWith("leave.") &&
    permission !== PERMISSIONS.LEAVE_MANAGE &&
    employee.permissions.includes(PERMISSIONS.LEAVE_MANAGE)
  ) {
    return true;
  }
  if (
    String(permission).startsWith("performance.") &&
    permission !== PERMISSIONS.PERFORMANCE_MANAGE &&
    employee.permissions.includes(PERMISSIONS.PERFORMANCE_MANAGE)
  ) {
    return true;
  }
  return false;
};

export const hasAnyPermission = (employee, permissions = []) =>
  permissions.some((permission) => hasPermission(employee, permission));

export const hasAllPermissions = (employee, permissions = []) =>
  permissions.every((permission) => hasPermission(employee, permission));

export const canAccessPath = (employee, pathname) => {
  if (!employee) return false;
  if (!canEmployeeLogin(employee.status)) return false;
  const required = requiredPermissionForPath(pathname);
  if (!required) return true;
  return hasPermission(employee, required);
};

export const hasRecognizedRole = (employee) => Boolean(employee && isKnownRole(employee.role));

export default {
  ADMIN_ONLY_PERMISSIONS,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessPath,
  hasRecognizedRole,
};

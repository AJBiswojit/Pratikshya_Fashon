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
import { isKnownRole } from "../../config/employeeRoles";
import { requiredPermissionForPath } from "../../config/employeeNavigation";

export const hasPermission = (employee, permission) => {
  if (!employee || !permission) return false;
  if (!canEmployeeLogin(employee.status)) return false;
  if (!Array.isArray(employee.permissions)) return false;
  return employee.permissions.includes(permission);
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
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  canAccessPath,
  hasRecognizedRole,
};

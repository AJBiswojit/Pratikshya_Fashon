/**
 * PRATIKSHYA FASHON — Admin access model.
 *
 * The Admin Portal is a third authentication boundary, separate from the
 * customer storefront and the employee portal:
 *
 *   CUSTOMER  → /signin        → pratikshya_auth
 *   EMPLOYEE  → /employee/login → pratikshya_employee_auth
 *   ADMIN     → /admin/login    → pratikshya_admin_auth
 *
 * Phase 10.1 ships exactly one admin role — SUPER_ADMIN. No employee role
 * satisfies admin access, and admin identity never satisfies employee or
 * customer routes.
 */

export const ADMIN_ROLES = {
  SUPER_ADMIN: "SUPER_ADMIN",
};

export const ADMIN_ROLE_DEFINITIONS = {
  [ADMIN_ROLES.SUPER_ADMIN]: {
    id: ADMIN_ROLES.SUPER_ADMIN,
    label: "Super Admin",
    description:
      "Highest-level business operator. People administration today; products, inventory, orders and analytics as later phases land.",
  },
};

export const ADMIN_STATUS = {
  ACTIVE: "ACTIVE",
  SUSPENDED: "SUSPENDED",
};

export const ADMIN_STATUSES = {
  [ADMIN_STATUS.ACTIVE]: {
    id: ADMIN_STATUS.ACTIVE,
    label: "Active",
    tone: "ink",
    canSignIn: true,
    blockedMessage: "",
  },
  [ADMIN_STATUS.SUSPENDED]: {
    id: ADMIN_STATUS.SUSPENDED,
    label: "Suspended",
    tone: "danger",
    canSignIn: false,
    blockedMessage: "This administrator account is suspended.",
  },
};

export const getAdminRole = (roleId) =>
  ADMIN_ROLE_DEFINITIONS[roleId] ?? {
    id: roleId || "UNKNOWN",
    label: "Unassigned",
    description: "This administration role is not recognised.",
  };

export const getAdminRoleLabel = (roleId) => getAdminRole(roleId).label;

export const getAdminStatus = (statusId) =>
  ADMIN_STATUSES[statusId] ?? ADMIN_STATUSES[ADMIN_STATUS.SUSPENDED];

export const getAdminStatusLabel = (statusId) => getAdminStatus(statusId).label;

export const canAdminSignIn = (statusId) => getAdminStatus(statusId).canSignIn;

export const isAdminRole = (roleId) => Boolean(ADMIN_ROLE_DEFINITIONS[roleId]);

export default {
  ADMIN_ROLES,
  ADMIN_ROLE_DEFINITIONS,
  ADMIN_STATUS,
  ADMIN_STATUSES,
  getAdminRole,
  getAdminRoleLabel,
  getAdminStatus,
  getAdminStatusLabel,
  canAdminSignIn,
  isAdminRole,
};

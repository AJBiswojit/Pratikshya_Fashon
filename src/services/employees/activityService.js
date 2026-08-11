/**
 * PRATIKSHYA FASHON — Lightweight employee activity log.
 *
 * Structured so the future Admin Portal can consume it. This is not an
 * enterprise audit trail — just a readable house diary of people events.
 *
 * Passwords are never written here.
 */

import { INITIAL_ACTIVITY } from "../../data/employees/operations";
import { readStorage, writeStorage } from "../../utils/shopping";
import { employeeFullName } from "../../utils/employee";
import { EMPLOYEE_STORAGE_KEYS } from "./storage";

export const ACTIVITY_ACTIONS = {
  EMPLOYEE_CREATED: "EMPLOYEE_CREATED",
  EMPLOYEE_UPDATED: "EMPLOYEE_UPDATED",
  ROLE_CHANGED: "ROLE_CHANGED",
  DEPARTMENT_CHANGED: "DEPARTMENT_CHANGED",
  PERMISSIONS_CHANGED: "PERMISSIONS_CHANGED",
  STATUS_CHANGED: "STATUS_CHANGED",
  EMPLOYEE_SUSPENDED: "EMPLOYEE_SUSPENDED",
  EMPLOYEE_ACTIVATED: "EMPLOYEE_ACTIVATED",
  EMPLOYEE_DEACTIVATED: "EMPLOYEE_DEACTIVATED",
  PASSWORD_RESET: "PASSWORD_RESET",
  PASSWORD_CHANGED: "PASSWORD_CHANGED",
  LOGIN: "LOGIN",
};

const ACTION_LABELS = {
  [ACTIVITY_ACTIONS.EMPLOYEE_CREATED]: "Employee created",
  [ACTIVITY_ACTIONS.EMPLOYEE_UPDATED]: "Employee updated",
  [ACTIVITY_ACTIONS.ROLE_CHANGED]: "Role changed",
  [ACTIVITY_ACTIONS.DEPARTMENT_CHANGED]: "Department changed",
  [ACTIVITY_ACTIONS.PERMISSIONS_CHANGED]: "Permissions updated",
  [ACTIVITY_ACTIONS.STATUS_CHANGED]: "Status changed",
  [ACTIVITY_ACTIONS.EMPLOYEE_SUSPENDED]: "Employee suspended",
  [ACTIVITY_ACTIONS.EMPLOYEE_ACTIVATED]: "Employee activated",
  [ACTIVITY_ACTIONS.EMPLOYEE_DEACTIVATED]: "Employee deactivated",
  [ACTIVITY_ACTIONS.PASSWORD_RESET]: "Password reset",
  [ACTIVITY_ACTIONS.PASSWORD_CHANGED]: "Password changed",
  [ACTIVITY_ACTIONS.LOGIN]: "Signed in",
};

export const getActivityLabel = (action) => ACTION_LABELS[action] ?? "Activity";

const normaliseEntry = (entry) => {
  if (!entry || typeof entry !== "object" || !entry.id) return null;
  return {
    id: String(entry.id),
    at: entry.at || new Date().toISOString(),
    actorEmployeeId: entry.actorEmployeeId || null,
    actorName: entry.actorName || "System",
    targetEmployeeId: entry.targetEmployeeId || null,
    action: entry.action || ACTIVITY_ACTIONS.EMPLOYEE_UPDATED,
    summary: String(entry.summary || getActivityLabel(entry.action)),
  };
};

export const loadActivity = () => {
  const stored = readStorage(EMPLOYEE_STORAGE_KEYS.ACTIVITY, null);
  if (Array.isArray(stored) && stored.length > 0) {
    return stored.map(normaliseEntry).filter(Boolean);
  }
  const seeded = INITIAL_ACTIVITY.map(normaliseEntry).filter(Boolean);
  writeStorage(EMPLOYEE_STORAGE_KEYS.ACTIVITY, seeded);
  return seeded;
};

export const saveActivity = (entries) => {
  writeStorage(
    EMPLOYEE_STORAGE_KEYS.ACTIVITY,
    (Array.isArray(entries) ? entries : []).map(normaliseEntry).filter(Boolean)
  );
};

export const recordActivity = (entries, draft) => {
  const entry = normaliseEntry({
    id: `act-${Date.now().toString(36)}-${Math.floor(Math.random() * 999)}`,
    at: new Date().toISOString(),
    ...draft,
  });
  if (!entry) return entries;
  const next = [entry, ...entries].slice(0, 200);
  saveActivity(next);
  return next;
};

export const activityForEmployee = (entries, employeeId) =>
  entries.filter(
    (entry) =>
      entry.targetEmployeeId === employeeId || entry.actorEmployeeId === employeeId
  );

export const describeActor = (actor) => {
  if (!actor) return { actorEmployeeId: null, actorName: "System" };
  return {
    actorEmployeeId: actor.employeeId || null,
    actorName: employeeFullName(actor),
  };
};

export default {
  ACTIVITY_ACTIONS,
  getActivityLabel,
  loadActivity,
  saveActivity,
  recordActivity,
  activityForEmployee,
  describeActor,
};

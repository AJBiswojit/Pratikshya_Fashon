/**
 * PRATIKSHYA FASHON — Employee management context.
 *
 * The people-administration surface of the Employee Portal
 * (/employee/management). Methods are thin wrappers around
 * employeeService. Employee management lives exclusively in the
 * Employee Portal — the Admin Portal reads this state only where a
 * business flow needs an employee selector (e.g. order fulfillment
 * assignment) and never exposes management UI.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useEmployeeAuth } from "./EmployeeAuthContext";
import { useAdminAuth } from "./AdminAuthContext";
import { getRoleLabel } from "../config/employeeRoles";
import { getDepartmentLabel, getSectionLabel, getStoreLabel } from "../config/employeeDepartments";
import { getStatusLabel } from "../config/employeeStatus";
import { employeeFullName } from "../utils/employee";
import {
  ACTIVITY_ACTIONS,
  ACTIVITY_CHANGED_EVENT,
  activityForEmployee,
  describeActor,
  loadActivity,
  recordActivity,
} from "../services/employees/activityService";
import {
  activateEmployee as activateRecord,
  createEmployee as createRecord,
  deactivateEmployee as deactivateRecord,
  ensureSeeded,
  getEmployee as findEmployee,
  getEmployees as filterEmployees,
  resetEmployeePassword as resetRecord,
  suspendEmployee as suspendRecord,
  updateEmployee as updateRecord,
  updateEmployeeDepartment as updateDepartmentRecord,
  updateEmployeePermissions as updatePermissionsRecord,
  updateEmployeeRole as updateRoleRecord,
} from "../services/employees/employeeService";

const EmployeeManagementContext = createContext(null);

export function EmployeeManagementProvider({ children }) {
  const { employee: actor, refreshSession } = useEmployeeAuth();
  const { admin, isSuperAdmin } = useAdminAuth();
  /*
   * The account-administration actor. Employee-account mutations are an
   * ADMIN capability: the service layer accepts them only from an
   * admin-domain identity (adminId). An employee session never qualifies.
   */
  const adminActor = useMemo(
    () => (isSuperAdmin && admin ? { adminId: admin.adminId, name: admin.name } : null),
    [admin, isSuperAdmin]
  );
  const [employees, setEmployees] = useState(() => ensureSeeded());
  const [activity, setActivity] = useState(() => loadActivity());
  const [isWorking, setIsWorking] = useState(false);

  /*
   * Phase 13 — the product repository writes product events straight into
   * this same diary. Re-read when it announces a write so both portals'
   * activity views stay live without a second activity system.
   */
  useEffect(() => {
    const sync = () => setActivity(loadActivity());
    window.addEventListener(ACTIVITY_CHANGED_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(ACTIVITY_CHANGED_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const syncIfCurrent = useCallback(
    (updated) => {
      if (updated && actor && updated.employeeId === actor.employeeId) {
        refreshSession();
      }
    },
    [actor, refreshSession]
  );

  const note = useCallback(
    (action, target, summary) => {
      setActivity((current) =>
        recordActivity(current, {
          /* Account administration is signed by the administrator when
             one is present; self-service edits by the employee. */
          ...describeActor(adminActor ?? actor),
          targetEmployeeId: target?.employeeId || null,
          action,
          summary,
        })
      );
    },
    [actor, adminActor]
  );

  /**
   * Records a non-people event — media, for instance — in the same diary.
   * Phase 12 uses this rather than standing up a second activity log.
   *
   * `actorOverride` lets the Admin Portal sign the entry with the signed-in
   * administrator, whose session is separate from the employee one.
   */
  const noteEvent = useCallback(
    (action, summary, actorOverride = null) => {
      setActivity((current) =>
        recordActivity(current, {
          ...describeActor(actor),
          ...(actorOverride ?? {}),
          action,
          summary,
        })
      );
    },
    [actor]
  );

  const getEmployees = useCallback(
    (filters) => filterEmployees(employees, filters),
    [employees]
  );

  const getEmployee = useCallback(
    (id) => findEmployee(employees, id),
    [employees]
  );

  const createEmployee = useCallback(
    async (draft) => {
      setIsWorking(true);
      await new Promise((resolve) => setTimeout(resolve, 280));
      const result = createRecord(employees, draft, adminActor);
      setIsWorking(false);
      if (!result.ok) return result;
      setEmployees(result.employees);
      note(
        ACTIVITY_ACTIONS.EMPLOYEE_CREATED,
        result.employee,
        `Created employee ${employeeFullName(result.employee)} · ${result.employee.employeeId}`
      );
      return result;
    },
    [employees, adminActor, note]
  );

  const updateEmployee = useCallback(
    async (employeeId, patch) => {
      setIsWorking(true);
      await new Promise((resolve) => setTimeout(resolve, 220));
      /* Administrators edit any account; an employee may pass through
         only to update their own contact details (service enforces). */
      const result = updateRecord(employees, employeeId, patch, adminActor ?? actor);
      setIsWorking(false);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.EMPLOYEE_UPDATED,
        result.employee,
        `Updated ${employeeFullName(result.employee)}`
      );
      return result;
    },
    [employees, actor, adminActor, note, syncIfCurrent]
  );

  const updateEmployeeRole = useCallback(
    async (employeeId, role, options) => {
      const result = updateRoleRecord(employees, employeeId, role, {
        ...(options ?? {}),
        actor: adminActor,
      });
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.ROLE_CHANGED,
        result.employee,
        `Changed role for ${employeeFullName(result.employee)} to ${getRoleLabel(role)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const updateEmployeeDepartment = useCallback(
    async (employeeId, assignment) => {
      const result = updateDepartmentRecord(employees, employeeId, assignment, adminActor);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.DEPARTMENT_CHANGED,
        result.employee,
        `Moved ${employeeFullName(result.employee)} to ${getDepartmentLabel(result.employee.department)} · ${getSectionLabel(result.employee.department, result.employee.section)} · ${getStoreLabel(result.employee.store)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const updateEmployeePermissions = useCallback(
    async (employeeId, permissions) => {
      const result = updatePermissionsRecord(employees, employeeId, permissions, adminActor);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.PERMISSIONS_CHANGED,
        result.employee,
        `Updated permissions for ${employeeFullName(result.employee)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const suspendEmployee = useCallback(
    async (employeeId) => {
      const result = suspendRecord(employees, employeeId, adminActor);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.EMPLOYEE_SUSPENDED,
        result.employee,
        `Suspended ${employeeFullName(result.employee)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const activateEmployee = useCallback(
    async (employeeId) => {
      const result = activateRecord(employees, employeeId, adminActor);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.EMPLOYEE_ACTIVATED,
        result.employee,
        `Activated ${employeeFullName(result.employee)} · ${getStatusLabel(result.employee.status)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const deactivateEmployee = useCallback(
    async (employeeId) => {
      const result = deactivateRecord(employees, employeeId, adminActor);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.EMPLOYEE_DEACTIVATED,
        result.employee,
        `Deactivated ${employeeFullName(result.employee)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const resetEmployeePassword = useCallback(
    async (employeeId) => {
      setIsWorking(true);
      await new Promise((resolve) => setTimeout(resolve, 240));
      const result = resetRecord(employees, employeeId, adminActor);
      setIsWorking(false);
      if (!result.ok) return result;
      setEmployees(result.employees);
      syncIfCurrent(result.employee);
      note(
        ACTIVITY_ACTIONS.PASSWORD_RESET,
        result.employee,
        `Reset password for ${employeeFullName(result.employee)}`
      );
      return result;
    },
    [employees, adminActor, note, syncIfCurrent]
  );

  const getActivity = useCallback(
    (employeeId = null) =>
      employeeId ? activityForEmployee(activity, employeeId) : activity,
    [activity]
  );

  const value = useMemo(
    () => ({
      employees,
      activity,
      isWorking,
      /* True only for a signed-in SUPER_ADMIN session (admin domain). */
      canManageAccounts: Boolean(adminActor),
      getEmployee,
      getEmployees,
      createEmployee,
      updateEmployee,
      updateEmployeeRole,
      updateEmployeeDepartment,
      updateEmployeePermissions,
      suspendEmployee,
      activateEmployee,
      deactivateEmployee,
      resetEmployeePassword,
      getActivity,
      noteEvent,
    }),
    [
      employees,
      activity,
      isWorking,
      adminActor,
      getEmployee,
      getEmployees,
      createEmployee,
      updateEmployee,
      updateEmployeeRole,
      updateEmployeeDepartment,
      updateEmployeePermissions,
      suspendEmployee,
      activateEmployee,
      deactivateEmployee,
      resetEmployeePassword,
      getActivity,
      noteEvent,
    ]
  );

  return (
    <EmployeeManagementContext.Provider value={value}>
      {children}
    </EmployeeManagementContext.Provider>
  );
}

const inertManagement = {
  employees: [],
  activity: [],
  isWorking: false,
  canManageAccounts: false,
  getEmployee: () => null,
  getEmployees: () => [],
  createEmployee: async () => ({ ok: false }),
  updateEmployee: async () => ({ ok: false }),
  updateEmployeeRole: async () => ({ ok: false }),
  updateEmployeeDepartment: async () => ({ ok: false }),
  updateEmployeePermissions: async () => ({ ok: false }),
  suspendEmployee: async () => ({ ok: false }),
  activateEmployee: async () => ({ ok: false }),
  deactivateEmployee: async () => ({ ok: false }),
  resetEmployeePassword: async () => ({ ok: false }),
  getActivity: () => [],
  noteEvent: () => {},
};

export function useEmployeeManagement() {
  return useContext(EmployeeManagementContext) ?? inertManagement;
}

export default EmployeeManagementContext;

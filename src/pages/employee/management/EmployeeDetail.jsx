import { useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import EmployeePage from "../../../components/employee/EmployeePage";
import StatusBadge from "../../../components/employee/StatusBadge";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import ActivityFeed from "../../../components/employee/ActivityFeed";
import PerformancePanel from "../../../components/employee/PerformancePanel";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import ConfirmDialog from "../../../components/orders/ConfirmDialog";
import { useEmployeeAuth } from "../../../context/EmployeeAuthContext";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { PERMISSIONS } from "../../../config/employeePermissions";
import { getDepartmentLabel, getSectionLabel, getStoreLabel } from "../../../config/employeeDepartments";
import { getRoleLabel } from "../../../config/employeeRoles";
import { employeeFullName, formatEmployeeDate, formatEmployeeDateTime } from "../../../utils/employee";
import { attendanceFor } from "../../../services/employees/operationsService";

export default function EmployeeDetail() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useEmployeeAuth();
  const {
    getEmployee,
    getActivity,
    suspendEmployee,
    activateEmployee,
    deactivateEmployee,
    resetEmployeePassword,
  } = useEmployeeManagement();
  const person = getEmployee(employeeId);
  const [confirm, setConfirm] = useState(null);
  const [issued, setIssued] = useState(null);

  if (!hasPermission(PERMISSIONS.EMPLOYEES_VIEW) && !hasPermission(PERMISSIONS.EMPLOYEES_MANAGE)) {
    return <Navigate to="/employee/access-denied" replace />;
  }

  if (!person) {
    return (
      <EmployeePage eyebrow="People" title="Employee not found">
        <p className="font-ui text-sm text-taupe">That employee ID is not in the house register.</p>
      </EmployeePage>
    );
  }

  const canManage = hasPermission(PERMISSIONS.EMPLOYEES_MANAGE);
  const canSuspend = hasPermission(PERMISSIONS.EMPLOYEES_SUSPEND) || canManage;
  const canReset = hasPermission(PERMISSIONS.EMPLOYEES_RESET_PASSWORD) || canManage;
  const canEdit = hasPermission(PERMISSIONS.EMPLOYEES_EDIT) || canManage;
  const attendance = attendanceFor(person.employeeId);

  const run = async () => {
    if (confirm === "suspend") await suspendEmployee(person.employeeId);
    if (confirm === "activate") await activateEmployee(person.employeeId);
    if (confirm === "deactivate") await deactivateEmployee(person.employeeId);
    if (confirm === "reset") {
      const result = await resetEmployeePassword(person.employeeId);
      if (result.ok) setIssued(result);
    }
    setConfirm(null);
  };

  const rows = [
    ["Employee ID", person.employeeId],
    ["Email", person.email],
    ["Phone", person.phone || "—"],
    ["Role", getRoleLabel(person.role)],
    ["Department", getDepartmentLabel(person.department)],
    ["Section", getSectionLabel(person.department, person.section)],
    ["Store", getStoreLabel(person.store)],
    ["Joined", formatEmployeeDate(person.joiningDate)],
    ["Last login", person.lastLogin ? formatEmployeeDateTime(person.lastLogin) : "Never"],
    ["Shift", person.shift],
    ["First-login password", person.mustChangePassword ? "Must change on next sign-in" : "Set"],
  ];

  return (
    <EmployeePage
      eyebrow="People"
      title={employeeFullName(person)}
      description={`${getRoleLabel(person.role)} · ${getDepartmentLabel(person.department)}`}
      actions={
        <div className="flex flex-wrap gap-2">
          {canEdit ? (
            <AtelierButton as={Link} to={`/employee/management/${person.employeeId}/edit`} size="chip">
              Edit
            </AtelierButton>
          ) : null}
          <AtelierButton variant="outline" size="chip" onClick={() => navigate("/employee/management")}>
            All employees
          </AtelierButton>
        </div>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={person.status} />
        {canSuspend && person.status !== "SUSPENDED" ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("suspend")}>
            Suspend
          </AtelierButton>
        ) : null}
        {canSuspend && person.status !== "ACTIVE" ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("activate")}>
            Activate
          </AtelierButton>
        ) : null}
        {canManage && person.status !== "INACTIVE" ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("deactivate")}>
            Deactivate
          </AtelierButton>
        ) : null}
        {canReset ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("reset")}>
            Reset password
          </AtelierButton>
        ) : null}
      </div>

      {issued?.temporaryPassword ? (
        <div className="mb-8">
          <CredentialSheet
            employee={issued.employee}
            temporaryPassword={issued.temporaryPassword}
            onDone={() => setIssued(null)}
          />
        </div>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)]">
        <dl className="divide-y divide-mist/70 border border-mist/80 bg-surface/30">
          {rows.map(([label, value]) => (
            <div key={label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_minmax(0,1fr)]">
              <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">{label}</dt>
              <dd className="font-ui text-sm text-ink">{value}</dd>
            </div>
          ))}
        </dl>
        <div className="space-y-6">
          <section className="border border-mist/80 bg-surface/40 p-6">
            <h2 className="font-display text-2xl font-light">Attendance today</h2>
            <p className="mt-2 font-ui text-sm text-taupe">
              {attendance.status.replaceAll("_", " ").toLowerCase()}
              {attendance.checkedInAt ? ` · in ${formatEmployeeDateTime(attendance.checkedInAt)}` : ""}
            </p>
          </section>
          <PerformancePanel employeeId={person.employeeId} compact />
        </div>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-light">Permissions</h2>
        <PermissionMatrix permissions={person.permissions} />
      </section>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-light">Account activity</h2>
        <ActivityFeed entries={getActivity(person.employeeId)} />
      </section>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={
          confirm === "reset"
            ? "Reset this password?"
            : confirm === "suspend"
              ? "Suspend this employee?"
              : confirm === "deactivate"
                ? "Deactivate this employee?"
                : "Activate this employee?"
        }
        description={
          confirm === "reset"
            ? "A new temporary DEMO password will be generated. The employee must change it on next sign-in. The password is never stored on their profile."
            : confirm === "suspend"
              ? "They will not be able to sign in until the account is activated again."
              : confirm === "deactivate"
                ? "The account will become inactive. Historical activity is kept."
                : "They will be able to sign in again with their current credentials."
        }
        confirmLabel="Confirm"
        cancelLabel="Keep"
        onConfirm={run}
        onCancel={() => setConfirm(null)}
      />
    </EmployeePage>
  );
}

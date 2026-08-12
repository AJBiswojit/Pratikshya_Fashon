import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import StatusBadge from "../../../components/employee/StatusBadge";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import ActivityFeed from "../../../components/employee/ActivityFeed";
import PerformancePanel from "../../../components/employee/PerformancePanel";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import ConfirmDialog from "../../../components/orders/ConfirmDialog";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { EMPLOYEE_STATUS } from "../../../config/employeeStatus";
import { getRoleLabel } from "../../../config/employeeRoles";
import {
  getDepartmentLabel,
  getSectionLabel,
  getStoreLabel,
} from "../../../config/employeeDepartments";
import {
  employeeFullName,
  formatEmployeeDate,
  formatEmployeeDateTime,
} from "../../../utils/employee";
import { attendanceFor } from "../../../services/employees/operationsService";

/**
 * /admin/employees/:employeeId
 *
 * The full account: assignment, permissions, attendance, performance and
 * the activity trail. Every action calls the shared Phase 10 service, so
 * the Employee Portal sees the result on the employee's next session.
 */
export default function AdminEmployeeDetail() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
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

  if (!person) {
    return (
      <AdminPage eyebrow="People" title="Employee not found">
        <p className="font-ui text-sm text-taupe">
          That employee ID is not in the house register.
        </p>
        <div className="mt-8">
          <AtelierButton as={Link} to="/admin/employees" size="chip">
            All employees
          </AtelierButton>
        </div>
      </AdminPage>
    );
  }

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
    [
      "Password",
      person.mustChangePassword ? "Must change on next sign-in" : "Set by the employee",
    ],
  ];

  const confirmCopy = {
    reset: {
      title: "Reset this password?",
      description:
        "A new temporary DEMO password is generated. The employee must change it on next sign-in, and it is never stored on their profile.",
    },
    suspend: {
      title: "Suspend this employee?",
      description: "They will be blocked from signing in until the account is activated again.",
    },
    deactivate: {
      title: "Deactivate this employee?",
      description: "The account becomes inactive. Historical activity is kept.",
    },
    activate: {
      title: "Activate this employee?",
      description: "They will be able to sign in again with their current credentials.",
    },
  };

  return (
    <AdminPage
      eyebrow="People"
      title={employeeFullName(person)}
      description={`${getRoleLabel(person.role)} · ${getDepartmentLabel(person.department)} · ${person.employeeId}`}
      actions={
        <>
          <AtelierButton as={Link} to={`/admin/employees/${person.employeeId}/edit`} size="chip">
            Edit
          </AtelierButton>
          <AtelierButton variant="outline" size="chip" onClick={() => navigate("/admin/employees")}>
            All employees
          </AtelierButton>
        </>
      }
    >
      <div className="mb-6 flex flex-wrap items-center gap-3">
        <StatusBadge status={person.status} />
        {person.status !== EMPLOYEE_STATUS.SUSPENDED ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("suspend")}>
            Suspend
          </AtelierButton>
        ) : null}
        {person.status !== EMPLOYEE_STATUS.ACTIVE ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("activate")}>
            Activate
          </AtelierButton>
        ) : null}
        {person.status !== EMPLOYEE_STATUS.INACTIVE ? (
          <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("deactivate")}>
            Deactivate
          </AtelierButton>
        ) : null}
        <AtelierButton variant="outline" size="chip" onClick={() => setConfirm("reset")}>
          Reset password
        </AtelierButton>
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
        <AdminPanel eyebrow="Account" title="Profile & assignment" bodyClassName="px-0 py-0 sm:px-0">
          <dl className="divide-y divide-mist/70">
            {rows.map(([label, value]) => (
              <div key={label} className="grid gap-1 px-5 py-3.5 sm:grid-cols-[180px_minmax(0,1fr)] sm:px-6">
                <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">{label}</dt>
                <dd className="font-ui text-sm break-words text-ink">{value}</dd>
              </div>
            ))}
          </dl>
        </AdminPanel>

        <div className="space-y-6">
          <AdminPanel eyebrow="Today" title="Attendance">
            <p className="font-ui text-sm text-taupe">
              {String(attendance.status).replaceAll("_", " ").toLowerCase()}
              {attendance.checkedInAt
                ? ` · in ${formatEmployeeDateTime(attendance.checkedInAt)}`
                : ""}
            </p>
          </AdminPanel>
          <PerformancePanel employeeId={person.employeeId} compact />
        </div>
      </div>

      <section className="mt-6">
        <AdminPanel
          eyebrow="Authorization"
          title="Permissions"
          action={
            <AtelierButton
              as={Link}
              to={`/admin/roles/${person.role}`}
              variant="outline"
              size="chip"
            >
              Role definition
            </AtelierButton>
          }
        >
          <PermissionMatrix permissions={person.permissions} />
        </AdminPanel>
      </section>

      <section className="mt-6">
        <AdminPanel eyebrow="History" title="Account activity" bodyClassName="px-0 py-0 sm:px-0">
          <ActivityFeed entries={getActivity(person.employeeId)} />
        </AdminPanel>
      </section>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirmCopy[confirm]?.title ?? "Confirm"}
        description={confirmCopy[confirm]?.description ?? ""}
        confirmLabel="Confirm"
        cancelLabel="Keep"
        onConfirm={run}
        onCancel={() => setConfirm(null)}
      />
    </AdminPage>
  );
}

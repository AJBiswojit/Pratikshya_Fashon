import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import StatusBadge from "../../../components/employee/StatusBadge";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import ActivityFeed from "../../../components/employee/ActivityFeed";
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

/**
 * /admin/employees/:employeeId — the ADMIN account-management profile.
 *
 * Identity, assignment, permissions, account state and the
 * account-administration activity trail. This is deliberately NOT the
 * Employee Portal dashboard — no attendance, performance or operational
 * desks are duplicated here.
 */
export default function AdminEmployeeDetail() {
  const { employeeId } = useParams();
  const {
    getEmployee,
    getActivity,
    isWorking,
    suspendEmployee,
    activateEmployee,
    deactivateEmployee,
    resetEmployeePassword,
  } = useEmployeeManagement();

  const person = getEmployee(employeeId);
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null);
  const [notice, setNotice] = useState("");

  if (!person) {
    return (
      <AdminPage eyebrow="People" title="Employee not found">
        <p className="font-ui text-sm text-taupe">
          That employee ID is not in the account register.
        </p>
        <div className="mt-8">
          <AtelierButton as={Link} to="/admin/employees" size="chip">
            All employees
          </AtelierButton>
        </div>
      </AdminPage>
    );
  }

  const run = async () => {
    if (busy) return;
    setBusy(true);
    setNotice("");
    let result = null;
    if (confirm === "suspend") result = await suspendEmployee(person.employeeId);
    if (confirm === "activate") result = await activateEmployee(person.employeeId);
    if (confirm === "deactivate") result = await deactivateEmployee(person.employeeId);
    if (confirm === "reset") {
      result = await resetEmployeePassword(person.employeeId);
      if (result?.ok) setIssued(result);
    }
    if (result && !result.ok) setNotice(result.message || "That action could not be completed.");
    setBusy(false);
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
    ["Created", person.createdAt ? formatEmployeeDateTime(person.createdAt) : "—"],
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
      description:
        "The account becomes inactive and cannot sign in. Historical records are kept intact.",
    },
    activate: {
      title: "Activate this employee?",
      description: "They will be able to sign in again with their current credentials.",
    },
  };

  const blocked =
    person.status === EMPLOYEE_STATUS.INACTIVE || person.status === EMPLOYEE_STATUS.SUSPENDED;

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          {employeeFullName(person)}
          <span className="italic text-accent">.</span>
        </>
      }
      description={`${person.employeeId} · ${getRoleLabel(person.role)} · ${getDepartmentLabel(person.department)}`}
      actions={
        <>
          <AtelierButton as={Link} to="/admin/employees" variant="outline" size="chip">
            All employees
          </AtelierButton>
          <AtelierButton as={Link} to={`/admin/employees/${person.employeeId}/edit`} size="chip">
            Edit account
          </AtelierButton>
        </>
      }
    >
      {issued?.temporaryPassword ? (
        <div className="mb-8">
          <CredentialSheet
            employee={issued.employee}
            temporaryPassword={issued.temporaryPassword}
            onDone={() => setIssued(null)}
          />
        </div>
      ) : null}

      {notice ? (
        <p role="alert" className="mb-6 border border-accent/40 bg-accent/[0.05] px-4 py-3 font-ui text-sm text-accent">
          {notice}
        </p>
      ) : null}

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <div className="space-y-6">
          <AdminPanel
            eyebrow="Account"
            title="Profile"
            action={<StatusBadge status={person.status} />}
          >
            <dl className="grid gap-x-8 gap-y-4 sm:grid-cols-2">
              {rows.map(([label, value]) => (
                <div key={label}>
                  <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
                    {label}
                  </dt>
                  <dd className="mt-1 font-ui text-sm text-ink">{value}</dd>
                </div>
              ))}
            </dl>
            {blocked ? (
              <p className="mt-5 border border-accent/30 bg-accent/[0.04] px-4 py-3 font-ui text-[11px] text-accent">
                Sign-in is blocked while this account is {person.status.toLowerCase()}. The
                account no longer appears in assignment selectors; history is kept.
              </p>
            ) : null}
          </AdminPanel>

          <AdminPanel
            eyebrow="Authorization"
            title="Permissions"
            action={
              <span className="font-ui text-[11px] text-taupe">
                {person.permissionMode === "custom" ? "Custom set" : "Role default"} ·{" "}
                {person.permissions.length}
              </span>
            }
          >
            <PermissionMatrix permissions={person.permissions} />
          </AdminPanel>
        </div>

        <div className="space-y-6">
          <AdminPanel eyebrow="Administration" title="Account actions">
            <div className="flex flex-wrap gap-3">
              {blocked ? (
                <AtelierButton size="chip" onClick={() => setConfirm("activate")} disabled={busy || isWorking}>
                  {busy && confirm === "activate" ? "Activating…" : "Activate account"}
                </AtelierButton>
              ) : (
                <>
                  <AtelierButton
                    variant="outline"
                    size="chip"
                    onClick={() => setConfirm("suspend")}
                    disabled={busy || isWorking}
                  >
                    Suspend
                  </AtelierButton>
                  <AtelierButton
                    variant="outline"
                    size="chip"
                    onClick={() => setConfirm("deactivate")}
                    disabled={busy || isWorking}
                  >
                    Deactivate
                  </AtelierButton>
                </>
              )}
              <AtelierButton
                variant="outline"
                size="chip"
                onClick={() => setConfirm("reset")}
                disabled={busy || isWorking}
              >
                {busy && confirm === "reset" ? "Resetting…" : "Reset password"}
              </AtelierButton>
            </div>
            <p className="mt-4 font-ui text-[11px] text-taupe">
              Every action is recorded in the account activity diary below. Nothing here
              deletes history.
            </p>
          </AdminPanel>

          <AdminPanel eyebrow="Diary" title="Account activity">
            <ActivityFeed entries={getActivity(person.employeeId)} />
          </AdminPanel>
        </div>
      </div>

      <ConfirmDialog
        isOpen={Boolean(confirm)}
        title={confirm ? confirmCopy[confirm].title : ""}
        description={confirm ? confirmCopy[confirm].description : ""}
        confirmLabel={busy ? "Working…" : "Confirm"}
        onConfirm={run}
        onCancel={() => (busy ? null : setConfirm(null))}
      />

    </AdminPage>
  );
}

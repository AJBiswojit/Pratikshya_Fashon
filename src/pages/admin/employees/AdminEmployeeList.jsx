import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminMetricCard from "../../../components/admin/AdminMetricCard";
import DataTable from "../../../components/employee/DataTable";
import StatusBadge from "../../../components/employee/StatusBadge";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import ConfirmDialog from "../../../components/orders/ConfirmDialog";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { ROLES, ROLE_OPTIONS, getRoleLabel } from "../../../config/employeeRoles";
import { DEPARTMENT_OPTIONS, getDepartmentLabel } from "../../../config/employeeDepartments";
import { EMPLOYEE_STATUS, STATUS_OPTIONS } from "../../../config/employeeStatus";
import { employeeFullName, formatEmployeeDateTime } from "../../../utils/employee";

/* Legitimate employee roles only — the Admin identity domain is separate. */
const EMPLOYEE_ROLE_FILTERS = ROLE_OPTIONS.filter((role) => role.id !== ROLES.SUPER_ADMIN);

/**
 * /admin/employees — SUPER ADMIN employee-account management.
 *
 * The canonical account register: create, view, edit, activate,
 * deactivate and reset credentials. It reads and writes the same
 * employee repository the Employee Portal authenticates against, so a
 * change here is what the employee login sees immediately.
 *
 * This is ACCOUNT administration only. Operational desks (attendance,
 * performance, assigned work) live in the Employee Portal.
 */
export default function AdminEmployeeList() {
  const {
    employees,
    isWorking,
    suspendEmployee,
    activateEmployee,
    deactivateEmployee,
    resetEmployeePassword,
  } = useEmployeeManagement();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(null);
  const [busy, setBusy] = useState(false);
  const [issued, setIssued] = useState(null);
  const [notice, setNotice] = useState("");

  const counts = useMemo(
    () => ({
      total: employees.length,
      active: employees.filter((person) => person.status === EMPLOYEE_STATUS.ACTIVE).length,
      inactive: employees.filter(
        (person) =>
          person.status === EMPLOYEE_STATUS.INACTIVE ||
          person.status === EMPLOYEE_STATUS.SUSPENDED
      ).length,
    }),
    [employees]
  );

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase();
    return employees.filter((person) => {
      if (role && person.role !== role) return false;
      if (department && person.department !== department) return false;
      if (status && person.status !== status) return false;
      if (!term) return true;
      return [person.employeeId, person.firstName, person.lastName, person.email]
        .join(" ")
        .toLowerCase()
        .includes(term);
    });
  }, [employees, query, role, department, status]);

  const runPending = async () => {
    if (!pending || busy) return;
    setBusy(true);
    setNotice("");
    let result = null;
    if (pending.action === "suspend") result = await suspendEmployee(pending.employeeId);
    if (pending.action === "activate") result = await activateEmployee(pending.employeeId);
    if (pending.action === "deactivate") result = await deactivateEmployee(pending.employeeId);
    if (pending.action === "reset") {
      result = await resetEmployeePassword(pending.employeeId);
      if (result?.ok) setIssued(result);
    }
    if (result && !result.ok) {
      setNotice(result.message || "That action could not be completed.");
    } else if (result?.ok && pending.action !== "reset") {
      setNotice(`${employeeFullName(result.employee)} is now ${result.employee.status.toLowerCase()}.`);
    }
    setBusy(false);
    setPending(null);
  };

  const dialogCopy = {
    suspend: {
      title: "Suspend this employee?",
      description:
        "They will be blocked from signing in to the Employee Portal until the account is activated again. History is kept.",
    },
    deactivate: {
      title: "Deactivate this employee?",
      description:
        "The account becomes inactive and cannot sign in. All historical records, reviews and activity are kept intact.",
    },
    activate: {
      title: "Activate this employee?",
      description: "They will be able to sign in again with their current credentials.",
    },
    reset: {
      title: "Reset this password?",
      description:
        "A new temporary DEMO password is generated and the employee must change it on next sign-in. Passwords are never stored on the profile.",
    },
  };

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          Employee <span className="italic text-accent">accounts.</span>
        </>
      }
      description="Super Admin account administration: create, edit, activate, deactivate and reset credentials. The Employee Portal reads every change on the next sign-in."
      actions={
        <AtelierButton as={Link} to="/admin/employees/new" size="chip">
          <UserPlus size={12} aria-hidden="true" /> Add employee
        </AtelierButton>
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
        <p role="status" aria-live="polite" className="mb-6 border border-mist/80 bg-canvas/70 px-4 py-3 font-ui text-sm text-ink">
          {notice}
        </p>
      ) : null}

      {/* Account counts */}
      <section aria-label="Account counts" className="mb-8 grid gap-4 sm:grid-cols-3">
        <AdminMetricCard label="Employees" value={counts.total} hint="All accounts on the register" />
        <AdminMetricCard label="Active" value={counts.active} hint="Can sign in today" />
        <AdminMetricCard
          label="Inactive / suspended"
          value={counts.inactive}
          hint="Sign-in blocked · history kept"
          tone={counts.inactive ? "alert" : undefined}
        />
      </section>

      {/* Search + filters */}
      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <EmployeeField label="Search" id="admin-emp-search">
          <input
            id="admin-emp-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name, email or employee ID"
            className={employeeInputClass()}
          />
        </EmployeeField>
        <EmployeeField label="Role" id="admin-emp-role">
          <select
            id="admin-emp-role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className={employeeInputClass()}
          >
            <option value="">All roles</option>
            {EMPLOYEE_ROLE_FILTERS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Department" id="admin-emp-dept">
          <select
            id="admin-emp-dept"
            value={department}
            onChange={(event) => setDepartment(event.target.value)}
            className={employeeInputClass()}
          >
            <option value="">All departments</option>
            {DEPARTMENT_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Status" id="admin-emp-status">
          <select
            id="admin-emp-status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            className={employeeInputClass()}
          >
            <option value="">All statuses</option>
            {STATUS_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </EmployeeField>
      </div>

      <DataTable
        rows={rows}
        rowKey="employeeId"
        empty="No employees match this search."
        columns={[
          {
            id: "name",
            label: "Employee",
            render: (person) => (
              <div className="min-w-0">
                <Link
                  to={`/admin/employees/${person.employeeId}`}
                  className="font-ui text-sm text-ink underline-offset-4 hover:text-accent hover:underline"
                >
                  {employeeFullName(person)}
                </Link>
                <p className="font-ui text-[11px] text-taupe">{person.employeeId}</p>
              </div>
            ),
          },
          { id: "role", label: "Role", render: (person) => getRoleLabel(person.role) },
          {
            id: "department",
            label: "Department",
            render: (person) => getDepartmentLabel(person.department),
          },
          {
            id: "email",
            label: "Email",
            render: (person) => <span className="text-taupe">{person.email}</span>,
          },
          {
            id: "permissions",
            label: "Permissions",
            render: (person) => (
              <span className="text-taupe">
                {person.permissionMode === "custom"
                  ? `Custom · ${person.permissions.length}`
                  : `Role default · ${person.permissions.length}`}
              </span>
            ),
          },
          {
            id: "lastLogin",
            label: "Last login",
            render: (person) => (
              <span className="text-taupe">
                {person.lastLogin ? formatEmployeeDateTime(person.lastLogin) : "Never"}
              </span>
            ),
          },
          {
            id: "status",
            label: "Status",
            render: (person) => <StatusBadge status={person.status} />,
          },
          {
            id: "actions",
            label: "Actions",
            render: (person) => (
              <div className="flex flex-wrap items-center gap-3 font-ui text-[11px]">
                <Link
                  to={`/admin/employees/${person.employeeId}`}
                  className="text-brass hover:text-accent"
                >
                  View
                </Link>
                <Link
                  to={`/admin/employees/${person.employeeId}/edit`}
                  className="text-brass hover:text-accent"
                >
                  Edit
                </Link>
                {person.status === EMPLOYEE_STATUS.INACTIVE ||
                person.status === EMPLOYEE_STATUS.SUSPENDED ? (
                  <button
                    type="button"
                    onClick={() => setPending({ action: "activate", employeeId: person.employeeId })}
                    className="text-brass hover:text-accent"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() =>
                      setPending({ action: "deactivate", employeeId: person.employeeId })
                    }
                    className="text-brass hover:text-accent"
                  >
                    Deactivate
                  </button>
                )}
              </div>
            ),
          },
        ]}
      />

      <p className="mt-6 font-ui text-[11px] text-taupe">
        Deactivation blocks sign-in and removes the account from assignment selectors.
        Historical records — reviews, activity, assignments — are never deleted.
      </p>

      <ConfirmDialog
        isOpen={Boolean(pending)}
        title={pending ? dialogCopy[pending.action].title : ""}
        description={pending ? dialogCopy[pending.action].description : ""}
        confirmLabel={
          busy || isWorking
            ? pending?.action === "reset"
              ? "Resetting…"
              : pending?.action === "activate"
                ? "Activating…"
                : "Deactivating…"
            : "Confirm"
        }
        onConfirm={runPending}
        onCancel={() => (busy ? null : setPending(null))}
      />
    </AdminPage>
  );
}

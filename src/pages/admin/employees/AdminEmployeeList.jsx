import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { UserPlus } from "lucide-react";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import DataTable from "../../../components/employee/DataTable";
import StatusBadge from "../../../components/employee/StatusBadge";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import ConfirmDialog from "../../../components/orders/ConfirmDialog";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { ROLE_OPTIONS, getRoleLabel } from "../../../config/employeeRoles";
import { DEPARTMENT_OPTIONS, getDepartmentLabel, getSectionLabel } from "../../../config/employeeDepartments";
import { EMPLOYEE_STATUS, STATUS_OPTIONS } from "../../../config/employeeStatus";
import { employeeFullName, formatEmployeeDateTime } from "../../../utils/employee";

/**
 * /admin/employees
 *
 * The house register, administered. It reads and writes the same
 * EmployeeManagementContext the Employee Portal uses — creating, suspending
 * or resetting here changes what the employee login sees immediately.
 */
export default function AdminEmployeeList() {
  const {
    employees,
    suspendEmployee,
    activateEmployee,
    resetEmployeePassword,
  } = useEmployeeManagement();

  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");
  const [pending, setPending] = useState(null);
  const [issued, setIssued] = useState(null);

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
    if (!pending) return;
    if (pending.action === "suspend") await suspendEmployee(pending.employeeId);
    if (pending.action === "activate") await activateEmployee(pending.employeeId);
    if (pending.action === "reset") {
      const result = await resetEmployeePassword(pending.employeeId);
      if (result.ok) setIssued(result);
    }
    setPending(null);
  };

  const dialogCopy = {
    suspend: {
      title: "Suspend this employee?",
      description:
        "They will be blocked from signing in to the Employee Portal until the account is activated again.",
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
          Employees of the <span className="italic text-accent">house.</span>
        </>
      }
      description="Accounts, roles, departments and credentials. Every change here is what the Employee Portal reads on the next sign-in."
      actions={
        <>
          <AtelierButton as={Link} to="/admin/roles" variant="outline" size="chip">
            Roles & permissions
          </AtelierButton>
          <AtelierButton as={Link} to="/admin/employees/new" size="chip">
            <UserPlus size={12} aria-hidden="true" /> Add employee
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
            {ROLE_OPTIONS.map((item) => (
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

      <p className="mb-3 font-ui text-[11px] text-taupe" aria-live="polite">
        Showing {rows.length} of {employees.length} accounts.
      </p>

      <DataTable
        rows={rows}
        rowKey="employeeId"
        columns={[
          { id: "employeeId", label: "Employee ID" },
          {
            id: "name",
            label: "Name",
            render: (row) => (
              <Link
                to={`/admin/employees/${row.employeeId}`}
                className="text-ink underline-offset-4 hover:text-accent hover:underline"
              >
                {employeeFullName(row)}
              </Link>
            ),
          },
          { id: "role", label: "Role", render: (row) => getRoleLabel(row.role) },
          {
            id: "department",
            label: "Department",
            render: (row) => getDepartmentLabel(row.department),
          },
          {
            id: "section",
            label: "Section",
            render: (row) => getSectionLabel(row.department, row.section),
          },
          { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            id: "lastLogin",
            label: "Last login",
            render: (row) => (row.lastLogin ? formatEmployeeDateTime(row.lastLogin) : "Never"),
          },
          {
            id: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap justify-end gap-x-3 gap-y-1 md:justify-start">
                <Link
                  to={`/admin/employees/${row.employeeId}`}
                  className="font-ui text-[12px] text-brass hover:text-accent"
                >
                  View
                </Link>
                <Link
                  to={`/admin/employees/${row.employeeId}/edit`}
                  className="font-ui text-[12px] text-brass hover:text-accent"
                >
                  Edit
                </Link>
                <button
                  type="button"
                  onClick={() => setPending({ action: "reset", employeeId: row.employeeId })}
                  className="font-ui text-[12px] text-brass hover:text-accent"
                >
                  Reset password
                </button>
                {row.status === EMPLOYEE_STATUS.SUSPENDED ? (
                  <button
                    type="button"
                    onClick={() => setPending({ action: "activate", employeeId: row.employeeId })}
                    className="font-ui text-[12px] text-brass hover:text-accent"
                  >
                    Activate
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => setPending({ action: "suspend", employeeId: row.employeeId })}
                    className="font-ui text-[12px] text-brass hover:text-accent"
                  >
                    Suspend
                  </button>
                )}
              </div>
            ),
          },
        ]}
        empty="No employees match those filters."
      />

      <ConfirmDialog
        isOpen={Boolean(pending)}
        title={dialogCopy[pending?.action]?.title ?? "Confirm"}
        description={dialogCopy[pending?.action]?.description ?? ""}
        confirmLabel="Confirm"
        cancelLabel="Keep"
        onConfirm={runPending}
        onCancel={() => setPending(null)}
      />
    </AdminPage>
  );
}

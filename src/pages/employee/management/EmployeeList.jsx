import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import EmployeePage from "../../../components/employee/EmployeePage";
import DataTable from "../../../components/employee/DataTable";
import StatusBadge from "../../../components/employee/StatusBadge";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import { useEmployeeAuth } from "../../../context/EmployeeAuthContext";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { ROLE_OPTIONS, getRoleLabel } from "../../../config/employeeRoles";
import { DEPARTMENT_OPTIONS, getDepartmentLabel } from "../../../config/employeeDepartments";
import { STATUS_OPTIONS } from "../../../config/employeeStatus";
import { PERMISSIONS } from "../../../config/employeePermissions";
import { employeeFullName, formatEmployeeDateTime } from "../../../utils/employee";

export default function EmployeeList() {
  const { hasPermission } = useEmployeeAuth();
  const { employees } = useEmployeeManagement();
  const canCreate = hasPermission(PERMISSIONS.EMPLOYEES_CREATE) || hasPermission(PERMISSIONS.EMPLOYEES_MANAGE);
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [status, setStatus] = useState("");

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

  return (
    <EmployeePage
      eyebrow="People"
      title={
        <>
          Employees of the <span className="italic text-accent">house.</span>
        </>
      }
      description="Admin-created accounts, roles and statuses. This list is the foundation the later Admin Portal will consume."
      actions={
        <>
          <AtelierButton as={Link} to="/employee/management/activity" variant="outline" size="chip">
            Activity
          </AtelierButton>
          {canCreate ? (
            <AtelierButton as={Link} to="/employee/management/new" size="chip">
              Create employee
            </AtelierButton>
          ) : null}
        </>
      }
    >
      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <EmployeeField label="Search">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Name or employee ID"
            className={employeeInputClass()}
          />
        </EmployeeField>
        <EmployeeField label="Role">
          <select value={role} onChange={(event) => setRole(event.target.value)} className={employeeInputClass()}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>
                {item.label}
              </option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Department">
          <select
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
        <EmployeeField label="Status">
          <select value={status} onChange={(event) => setStatus(event.target.value)} className={employeeInputClass()}>
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
        columns={[
          { id: "employeeId", label: "Employee ID" },
          { id: "name", label: "Name", render: (row) => employeeFullName(row) },
          { id: "role", label: "Role", render: (row) => getRoleLabel(row.role) },
          { id: "department", label: "Department", render: (row) => getDepartmentLabel(row.department) },
          { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
          {
            id: "lastLogin",
            label: "Last login",
            render: (row) => (row.lastLogin ? formatEmployeeDateTime(row.lastLogin) : "—"),
          },
          {
            id: "actions",
            label: "Actions",
            render: (row) => (
              <div className="flex flex-wrap gap-3">
                <Link to={`/employee/management/${row.employeeId}`} className="text-brass hover:text-accent">
                  View
                </Link>
                {hasPermission(PERMISSIONS.EMPLOYEES_EDIT) || hasPermission(PERMISSIONS.EMPLOYEES_MANAGE) ? (
                  <Link to={`/employee/management/${row.employeeId}/edit`} className="text-brass hover:text-accent">
                    Edit
                  </Link>
                ) : null}
              </div>
            ),
          },
        ]}
        empty="No employees match those filters."
      />
    </EmployeePage>
  );
}

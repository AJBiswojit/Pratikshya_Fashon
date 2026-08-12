import { useMemo } from "react";
import { Link } from "react-router-dom";
import AdminPage from "../../components/admin/AdminPage";
import DataTable from "../../components/employee/DataTable";
import { useEmployeeManagement } from "../../context/EmployeeManagementContext";
import { ROLE_OPTIONS } from "../../config/employeeRoles";

/**
 * /admin/roles
 *
 * A read of the centralised role definitions — the same ones the Employee
 * Portal authorises against. Permission counts and headcount are derived,
 * never stored separately.
 */
export default function AdminRoles() {
  const { employees } = useEmployeeManagement();

  const rows = useMemo(
    () =>
      ROLE_OPTIONS.map((role) => ({
        id: role.id,
        label: role.label,
        description: role.description,
        permissions: role.defaultPermissions.length,
        assigned: employees.filter((person) => person.role === role.id).length,
      })),
    [employees]
  );

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          Roles & <span className="italic text-accent">permissions.</span>
        </>
      }
      description="The house's role definitions and the authorization each one grants. Open a role to read its full permission matrix."
    >
      <DataTable
        rows={rows}
        rowKey="id"
        columns={[
          {
            id: "label",
            label: "Role",
            render: (row) => (
              <Link
                to={`/admin/roles/${row.id}`}
                className="text-ink underline-offset-4 hover:text-accent hover:underline"
              >
                {row.label}
              </Link>
            ),
          },
          {
            id: "description",
            label: "Description",
            render: (row) => <span className="text-taupe">{row.description}</span>,
          },
          {
            id: "permissions",
            label: "Permissions",
            render: (row) => `${row.permissions} permission${row.permissions === 1 ? "" : "s"}`,
          },
          {
            id: "assigned",
            label: "Employees",
            render: (row) => `${row.assigned} employee${row.assigned === 1 ? "" : "s"}`,
          },
          {
            id: "actions",
            label: "Actions",
            render: (row) => (
              <Link
                to={`/admin/roles/${row.id}`}
                className="font-ui text-[12px] text-brass hover:text-accent"
              >
                View matrix
              </Link>
            ),
          },
        ]}
      />

      <p className="mt-6 font-ui text-[11px] leading-relaxed text-taupe">
        Role definitions are centralised in the authorization model. Per-employee
        permissions can be refined on an individual account; custom role creation is
        deliberately left to a later phase rather than half-built here.
      </p>
    </AdminPage>
  );
}

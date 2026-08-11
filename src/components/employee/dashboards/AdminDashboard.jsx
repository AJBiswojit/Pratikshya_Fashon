import { Link } from "react-router-dom";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { EMPLOYEE_STATUS } from "../../../config/employeeStatus";
import { employeeFullName, formatEmployeeDateTime } from "../../../utils/employee";
import { getRoleLabel } from "../../../config/employeeRoles";
import ActivityFeed from "../ActivityFeed";
import DataTable from "../DataTable";
import StatusBadge from "../StatusBadge";
import DashboardFrame from "./DashboardFrame";

export default function AdminDashboard() {
  const { employees, activity } = useEmployeeManagement();
  const active = employees.filter((person) => person.status === EMPLOYEE_STATUS.ACTIVE).length;
  const pending = employees.filter((person) => person.mustChangePassword).length;
  const blocked = employees.filter(
    (person) => person.status === EMPLOYEE_STATUS.SUSPENDED || person.status === EMPLOYEE_STATUS.INACTIVE
  );

  return (
    <DashboardFrame
      eyebrow="Operations command"
      description="People, roles and the house diary. Full business administration belongs to the later Admin Portal — this desk is the employee-management foundation."
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link
          to="/employee/management/new"
          className="bg-ink px-4 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] text-ivory hover:bg-accent"
        >
          Create employee
        </Link>
        <Link
          to="/employee/management"
          className="border border-pearl px-4 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] text-ink hover:border-ink"
        >
          All employees · {employees.length}
        </Link>
        <Link
          to="/employee/management/activity"
          className="border border-pearl px-4 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] text-ink hover:border-ink"
        >
          Activity log
        </Link>
        <span className="border border-mist px-4 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] text-taupe">
          Active {active} · First login {pending}
        </span>
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Recent people</h2>
          <DataTable
            rows={employees.slice(0, 6)}
            columns={[
              { id: "employeeId", label: "ID" },
              { id: "name", label: "Name", render: (row) => employeeFullName(row) },
              { id: "role", label: "Role", render: (row) => getRoleLabel(row.role) },
              { id: "status", label: "Status", render: (row) => <StatusBadge status={row.status} /> },
              {
                id: "lastLogin",
                label: "Last login",
                render: (row) => (row.lastLogin ? formatEmployeeDateTime(row.lastLogin) : "—"),
              },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">House diary</h2>
          <ActivityFeed entries={activity.slice(0, 6)} />
        </section>
      </div>

      {blocked.length ? (
        <p className="mt-6 font-ui text-xs text-taupe">
          {blocked.length} account{blocked.length === 1 ? "" : "s"} cannot sign in
          {blocked[0] ? ` — including ${employeeFullName(blocked[0])}` : ""}.
        </p>
      ) : null}
    </DashboardFrame>
  );
}

import { useMemo } from "react";
import { Link, useParams } from "react-router-dom";
import { AtelierButton } from "../../design-system";
import AdminPage from "../../components/admin/AdminPage";
import AdminPanel from "../../components/admin/AdminPanel";
import PermissionMatrix from "../../components/employee/PermissionMatrix";
import StatusBadge from "../../components/employee/StatusBadge";
import { useEmployeeManagement } from "../../context/EmployeeManagementContext";
import { getRole, isKnownRole } from "../../config/employeeRoles";
import { getDepartmentLabel } from "../../config/employeeDepartments";
import { employeeFullName } from "../../utils/employee";

/**
 * /admin/roles/:roleId
 *
 * The permission matrix for one role, read from the same centralised
 * catalogue the Employee Portal authorises against — no duplicated
 * permission definitions anywhere in the Admin Portal.
 */
export default function AdminRoleDetail() {
  const { roleId } = useParams();
  const { employees } = useEmployeeManagement();
  const role = getRole(roleId);
  const known = isKnownRole(roleId);

  const assigned = useMemo(
    () => employees.filter((person) => person.role === roleId),
    [employees, roleId]
  );

  if (!known) {
    return (
      <AdminPage eyebrow="People" title="Role not found">
        <p className="font-ui text-sm text-taupe">That role is not in the authorization model.</p>
        <div className="mt-8">
          <AtelierButton as={Link} to="/admin/roles" size="chip">
            All roles
          </AtelierButton>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="Role definition"
      title={role.label}
      description={role.description}
      actions={
        <AtelierButton as={Link} to="/admin/roles" variant="outline" size="chip">
          All roles
        </AtelierButton>
      }
    >
      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {[
          ["Permissions", role.defaultPermissions.length],
          ["Employees assigned", assigned.length],
          ["ID prefix", `PF-${role.idPrefix}-`],
        ].map(([label, value]) => (
          <div key={label} className="border border-mist/80 bg-surface/40 p-5">
            <p className="font-ui text-[10px] uppercase tracking-[.18em] text-taupe">{label}</p>
            <p className="mt-2 font-display text-2xl font-light text-ink">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
        <AdminPanel eyebrow="Authorization" title="Permission matrix">
          <PermissionMatrix permissions={role.defaultPermissions} />
        </AdminPanel>

        <AdminPanel eyebrow="People" title="Assigned employees" bodyClassName="px-0 py-0 sm:px-0">
          {assigned.length ? (
            <ul className="divide-y divide-mist/70">
              {assigned.map((person) => (
                <li key={person.employeeId} className="flex items-start justify-between gap-3 px-5 py-3.5 sm:px-6">
                  <div className="min-w-0">
                    <Link
                      to={`/admin/employees/${person.employeeId}`}
                      className="truncate font-ui text-sm text-ink underline-offset-4 hover:text-accent hover:underline"
                    >
                      {employeeFullName(person)}
                    </Link>
                    <p className="font-ui text-[11px] text-taupe">
                      {person.employeeId} · {getDepartmentLabel(person.department)}
                    </p>
                  </div>
                  <StatusBadge status={person.status} />
                </li>
              ))}
            </ul>
          ) : (
            <p className="px-5 py-6 font-ui text-sm text-taupe sm:px-6">
              Nobody currently holds this role.
            </p>
          )}
        </AdminPanel>
      </div>
    </AdminPage>
  );
}

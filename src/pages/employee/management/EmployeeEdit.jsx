import { useEffect, useState } from "react";
import { Navigate, useNavigate, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import EmployeePage from "../../../components/employee/EmployeePage";
import EmployeeForm from "../../../components/employee/EmployeeForm";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import { useEmployeeAuth } from "../../../context/EmployeeAuthContext";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { PERMISSIONS } from "../../../config/employeePermissions";
import { getDefaultPermissions } from "../../../config/employeeRoles";

export default function EmployeeEdit() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
  const { hasPermission } = useEmployeeAuth();
  const {
    getEmployee,
    updateEmployee,
    updateEmployeeRole,
    updateEmployeeDepartment,
    updateEmployeePermissions,
    isWorking,
  } = useEmployeeManagement();
  const person = getEmployee(employeeId);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [permissions, setPermissions] = useState([]);
  const canManagePermissions =
    hasPermission(PERMISSIONS.EMPLOYEES_MANAGE_PERMISSIONS) ||
    hasPermission(PERMISSIONS.EMPLOYEES_MANAGE);

  useEffect(() => {
    if (!person) return;
    setDraft({
      firstName: person.firstName,
      lastName: person.lastName,
      email: person.email,
      phone: person.phone,
      role: person.role,
      department: person.department,
      section: person.section,
      store: person.store,
      joiningDate: person.joiningDate,
      status: person.status,
    });
    setPermissions(person.permissions);
  }, [person]);

  if (!hasPermission(PERMISSIONS.EMPLOYEES_EDIT) && !hasPermission(PERMISSIONS.EMPLOYEES_MANAGE)) {
    return <Navigate to="/employee/access-denied" replace />;
  }

  if (!person || !draft) {
    return (
      <EmployeePage eyebrow="People" title="Employee not found">
        <p className="font-ui text-sm text-taupe">That employee cannot be edited.</p>
      </EmployeePage>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (draft.role !== person.role) {
      await updateEmployeeRole(person.employeeId, draft.role);
    }
    await updateEmployeeDepartment(person.employeeId, {
      department: draft.department,
      section: draft.section,
      store: draft.store,
    });
    const result = await updateEmployee(person.employeeId, {
      firstName: draft.firstName,
      lastName: draft.lastName,
      email: draft.email,
      phone: draft.phone,
      joiningDate: draft.joiningDate,
      status: draft.status,
    });
    if (!result.ok) {
      setErrors(result.errors || {});
      return;
    }
    if (canManagePermissions) {
      await updateEmployeePermissions(person.employeeId, permissions);
    }
    navigate(`/employee/management/${person.employeeId}`);
  };

  return (
    <EmployeePage
      eyebrow="People"
      title={
        <>
          Edit <span className="italic text-accent">{person.firstName}.</span>
        </>
      }
      description={`${person.employeeId} · Changing role replaces default permissions unless you keep a custom matrix below.`}
    >
      <form onSubmit={handleSubmit} className="space-y-8 border border-mist/80 bg-surface/40 p-6 sm:p-8">
        <EmployeeForm values={draft} errors={errors} onChange={setDraft} idPrefix="edit" />

        {canManagePermissions ? (
          <div>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-light">Permissions</h2>
              <AtelierButton
                type="button"
                variant="outline"
                size="chip"
                onClick={() => setPermissions(getDefaultPermissions(draft.role))}
              >
                Reset to role default
              </AtelierButton>
            </div>
            <PermissionMatrix
              permissions={permissions}
              editable
              onToggle={(key, allowed) =>
                setPermissions((current) =>
                  allowed ? [...new Set([...current, key])] : current.filter((item) => item !== key)
                )
              }
            />
          </div>
        ) : null}

        <div className="flex flex-wrap gap-3">
          <AtelierButton type="submit" disabled={isWorking}>
            {isWorking ? "Saving..." : "Save changes"}
          </AtelierButton>
          <AtelierButton
            type="button"
            variant="outline"
            onClick={() => navigate(`/employee/management/${person.employeeId}`)}
          >
            Cancel
          </AtelierButton>
        </div>
      </form>
    </EmployeePage>
  );
}

import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import EmployeeForm from "../../../components/employee/EmployeeForm";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { getDefaultPermissions } from "../../../config/employeeRoles";

/**
 * /admin/employees/:employeeId/edit — SUPER ADMIN edits an account.
 *
 * Name, contact, role, department, status and permissions all go through
 * the shared employee service. The role selector exposes legitimate
 * employee roles only — an employee can never be converted into an Admin
 * identity, and the service refuses SUPER_ADMIN besides.
 */
export default function AdminEmployeeEdit() {
  const { employeeId } = useParams();
  const navigate = useNavigate();
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
  const [saving, setSaving] = useState(false);
  const [failure, setFailure] = useState("");

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
    /* Keyed on the identity, not the object, so edits are not clobbered. */
  }, [person?.employeeId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!person || !draft) {
    return (
      <AdminPage eyebrow="People" title="Employee not found">
        <p className="font-ui text-sm text-taupe">That employee cannot be edited.</p>
        <div className="mt-8">
          <AtelierButton as={Link} to="/admin/employees" size="chip">
            All employees
          </AtelierButton>
        </div>
      </AdminPage>
    );
  }

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving || isWorking) return; /* No duplicate submissions. */
    setSaving(true);
    setFailure("");

    let failed = null;

    if (draft.role !== person.role) {
      const roleResult = await updateEmployeeRole(person.employeeId, draft.role);
      if (!roleResult.ok) failed = roleResult;
    }
    if (
      !failed &&
      (draft.department !== person.department ||
        draft.section !== person.section ||
        draft.store !== person.store)
    ) {
      const deptResult = await updateEmployeeDepartment(person.employeeId, {
        department: draft.department,
        section: draft.section,
        store: draft.store,
      });
      if (!deptResult.ok) failed = deptResult;
    }

    if (!failed) {
      const result = await updateEmployee(person.employeeId, {
        firstName: draft.firstName,
        lastName: draft.lastName,
        email: draft.email,
        phone: draft.phone,
        joiningDate: draft.joiningDate,
        status: draft.status,
      });
      if (!result.ok) failed = result;
    }

    if (!failed) {
      const changedPermissions =
        JSON.stringify([...permissions].sort()) !==
        JSON.stringify([...person.permissions].sort());
      if (changedPermissions) {
        const permResult = await updateEmployeePermissions(person.employeeId, permissions);
        if (!permResult.ok) failed = permResult;
      }
    }

    setSaving(false);
    if (failed) {
      setErrors(failed.errors || {});
      setFailure(failed.message || "The account could not be saved.");
      return;
    }
    navigate(`/admin/employees/${person.employeeId}`);
  };

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          Edit <span className="italic text-accent">{person.firstName}.</span>
        </>
      }
      description={`${person.employeeId} — role, assignment, contact, status and permissions. Admin identities cannot be assigned here.`}
      actions={
        <AtelierButton as={Link} to={`/admin/employees/${person.employeeId}`} variant="outline" size="chip">
          View account
        </AtelierButton>
      }
    >
      {failure ? (
        <p role="alert" className="mb-6 border border-accent/40 bg-accent/[0.05] px-4 py-3 font-ui text-sm text-accent">
          {failure}
        </p>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-8 border border-mist/80 bg-surface/40 p-6 sm:p-8"
      >
        <EmployeeForm values={draft} errors={errors} onChange={setDraft} idPrefix="admin-edit" />

        <div>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="font-ui text-[10px] uppercase tracking-[.2em] text-brass">
              Permissions
            </h2>
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

        <div className="flex flex-wrap gap-3">
          <AtelierButton type="submit" disabled={saving || isWorking}>
            {saving || isWorking ? "Saving…" : "Save changes"}
          </AtelierButton>
          <AtelierButton
            type="button"
            variant="outline"
            onClick={() => navigate(`/admin/employees/${person.employeeId}`)}
          >
            Cancel
          </AtelierButton>
        </div>
      </form>
    </AdminPage>
  );
}

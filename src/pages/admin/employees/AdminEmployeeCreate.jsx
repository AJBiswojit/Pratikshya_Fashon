import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import EmployeeForm, { emptyEmployeeDraft } from "../../../components/employee/EmployeeForm";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { getDefaultPermissions } from "../../../config/employeeRoles";

/**
 * /admin/employees/new — SUPER ADMIN creates an employee account.
 *
 * Creation goes through the existing employee service: deterministic
 * employee-ID generation, temporary credential issue, role defaults and
 * the activity entry are reused, not reimplemented. The role selector
 * (EmployeeForm) exposes legitimate employee roles only — SUPER_ADMIN
 * cannot be created here, and the service rejects it besides.
 */
export default function AdminEmployeeCreate() {
  const navigate = useNavigate();
  const { createEmployee, isWorking } = useEmployeeManagement();
  const [draft, setDraft] = useState(emptyEmployeeDraft);
  const [errors, setErrors] = useState({});
  const [custom, setCustom] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [result, setResult] = useState(null);
  const [failure, setFailure] = useState("");

  const handleChange = (next) => {
    setDraft(next);
    if (next.role && next.role !== draft.role && !custom) {
      setPermissions(getDefaultPermissions(next.role));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isWorking) return; /* No duplicate submissions. */
    setFailure("");
    const created = await createEmployee({
      ...draft,
      permissionMode: custom ? "custom" : "role",
      permissions: custom ? permissions : getDefaultPermissions(draft.role),
    });
    if (!created.ok) {
      setErrors(created.errors || {});
      if (created.code === "FORBIDDEN") setFailure(created.message);
      return;
    }
    setResult(created);
  };

  if (result?.employee) {
    return (
      <AdminPage
        eyebrow="People"
        title={
          <>
            Employee <span className="italic text-accent">created.</span>
          </>
        }
        description="Share these once. The colleague must change the temporary password on first sign-in."
      >
        <CredentialSheet
          employee={result.employee}
          temporaryPassword={result.temporaryPassword}
          onDone={() => navigate(`/admin/employees/${result.employee.employeeId}`)}
        />
        <div className="mt-6 flex flex-wrap gap-3">
          <AtelierButton
            size="chip"
            onClick={() => navigate(`/admin/employees/${result.employee.employeeId}`)}
          >
            Open employee
          </AtelierButton>
          <AtelierButton
            variant="outline"
            size="chip"
            onClick={() => navigate("/admin/employees")}
          >
            All employees
          </AtelierButton>
        </div>
      </AdminPage>
    );
  }

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          Add an <span className="italic text-accent">employee.</span>
        </>
      }
      description="An employee ID and a temporary password are generated on save. Role, department, section, store and permissions are assigned here. Admin identities cannot be created as employees."
      actions={
        <AtelierButton as={Link} to="/admin/employees" variant="outline" size="chip">
          All employees
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
        <EmployeeForm values={draft} errors={errors} onChange={handleChange} idPrefix="admin-create" />

        <div>
          <label className="flex items-center gap-3 font-ui text-sm text-ink">
            <input
              type="checkbox"
              checked={custom}
              onChange={(event) => {
                setCustom(event.target.checked);
                if (event.target.checked && draft.role) {
                  setPermissions(getDefaultPermissions(draft.role));
                }
              }}
              className="accent-ink"
            />
            Customise permissions instead of using the role default
          </label>
          {custom ? (
            <div className="mt-5">
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
          ) : (
            <p className="mt-3 font-ui text-xs text-taupe">
              Default permissions for the selected role will be applied. They can be refined later.
            </p>
          )}
        </div>

        <div className="flex flex-wrap gap-3">
          <AtelierButton type="submit" disabled={isWorking}>
            {isWorking ? "Creating…" : "Create employee"}
          </AtelierButton>
          <AtelierButton type="button" variant="outline" onClick={() => navigate("/admin/employees")}>
            Cancel
          </AtelierButton>
        </div>
      </form>
    </AdminPage>
  );
}

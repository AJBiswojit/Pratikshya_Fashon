import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import EmployeeForm, { emptyEmployeeDraft } from "../../../components/employee/EmployeeForm";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { getDefaultPermissions } from "../../../config/employeeRoles";

/**
 * /admin/employees/new
 *
 * Creation goes through the existing Phase 10 service: employee ID
 * generation, temporary credential issue, role defaults, department
 * assignment and the activity entry are all reused, not reimplemented.
 * The new account is immediately usable at /employee/login.
 */
export default function AdminEmployeeCreate() {
  const navigate = useNavigate();
  const { createEmployee, isWorking } = useEmployeeManagement();
  const [draft, setDraft] = useState(emptyEmployeeDraft);
  const [errors, setErrors] = useState({});
  const [custom, setCustom] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [result, setResult] = useState(null);

  const handleChange = (next) => {
    setDraft(next);
    if (next.role && next.role !== draft.role && !custom) {
      setPermissions(getDefaultPermissions(next.role));
    }
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const created = await createEmployee({
      ...draft,
      permissionMode: custom ? "custom" : "role",
      permissions: custom ? permissions : getDefaultPermissions(draft.role),
    });
    if (!created.ok) {
      setErrors(created.errors || {});
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
            Close
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
      description="An employee ID and a temporary password are generated on save. Role, department, section, store and permissions are assigned here."
      actions={
        <AtelierButton variant="outline" size="chip" onClick={() => navigate("/admin/employees")}>
          All employees
        </AtelierButton>
      }
    >
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
            {isWorking ? "Creating account..." : "Create employee"}
          </AtelierButton>
          <AtelierButton type="button" variant="outline" onClick={() => navigate("/admin/employees")}>
            Cancel
          </AtelierButton>
        </div>
      </form>
    </AdminPage>
  );
}

import { useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import EmployeePage from "../../../components/employee/EmployeePage";
import EmployeeForm, { emptyEmployeeDraft } from "../../../components/employee/EmployeeForm";
import CredentialSheet from "../../../components/employee/CredentialSheet";
import PermissionMatrix from "../../../components/employee/PermissionMatrix";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { getDefaultPermissions } from "../../../config/employeeRoles";
import { PERMISSIONS } from "../../../config/employeePermissions";
import { useEmployeeAuth } from "../../../context/EmployeeAuthContext";

export default function EmployeeCreate() {
  const navigate = useNavigate();
  const { hasPermission } = useEmployeeAuth();
  const { createEmployee, isWorking } = useEmployeeManagement();
  const [draft, setDraft] = useState(emptyEmployeeDraft);
  const [errors, setErrors] = useState({});
  const [custom, setCustom] = useState(false);
  const [permissions, setPermissions] = useState([]);
  const [result, setResult] = useState(null);

  if (!hasPermission(PERMISSIONS.EMPLOYEES_CREATE) && !hasPermission(PERMISSIONS.EMPLOYEES_MANAGE)) {
    return <Navigate to="/employee/access-denied" replace />;
  }

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
      <EmployeePage eyebrow="People" title="Employee created">
        <CredentialSheet
          employee={result.employee}
          temporaryPassword={result.temporaryPassword}
          onDone={() => navigate(`/employee/management/${result.employee.employeeId}`)}
        />
      </EmployeePage>
    );
  }

  return (
    <EmployeePage
      eyebrow="People"
      title={
        <>
          Create an <span className="italic text-accent">employee.</span>
        </>
      }
      description="An employee ID and temporary password are generated on save. The new colleague must change the password on first sign-in."
    >
      <form onSubmit={handleSubmit} className="space-y-8 border border-mist/80 bg-surface/40 p-6 sm:p-8">
        <EmployeeForm values={draft} errors={errors} onChange={handleChange} idPrefix="create" />

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
          <AtelierButton type="button" variant="outline" onClick={() => navigate("/employee/management")}>
            Cancel
          </AtelierButton>
        </div>
      </form>
    </EmployeePage>
  );
}

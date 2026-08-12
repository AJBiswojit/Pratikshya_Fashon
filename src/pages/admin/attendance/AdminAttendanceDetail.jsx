import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import AttendanceSummary from "../../../components/workforce/AttendanceSummary";
import AttendanceHistory from "../../../components/workforce/AttendanceHistory";
import { CorrectionForm } from "../../../components/workforce/CorrectionDialog";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { useWorkforce } from "../../../context/WorkforceContext";
import { getDepartmentLabel, getStoreLabel } from "../../../config/employeeDepartments";
import { getRoleLabel } from "../../../config/employeeRoles";
import { employeeFullName } from "../../../utils/employee";
import { getTodayAttendance, monthRecordsForEmployee } from "../../../services/workforce/attendanceService";
import { monthKey } from "../../../services/workforce/dateUtils";

export default function AdminAttendanceDetail() {
  const { employeeId } = useParams();
  const { admin } = useAdminAuth();
  const { getEmployee } = useEmployeeManagement();
  const { revision } = useWorkforce();
  const [month, setMonth] = useState(monthKey());
  const person = getEmployee(employeeId);
  void revision;

  if (!person) {
    return (
      <AdminPage eyebrow="Attendance" title="Employee not found">
        <AtelierButton as={Link} to="/admin/attendance" size="chip">
          All attendance
        </AtelierButton>
      </AdminPage>
    );
  }

  const today = getTodayAttendance(person.employeeId);
  const history = monthRecordsForEmployee(person.employeeId, month);
  const selected = history.find((row) => row.date === today?.date) || today;

  return (
    <AdminPage
      eyebrow="Attendance"
      title={employeeFullName(person)}
      description={`${person.employeeId} · ${getRoleLabel(person.role)} · ${getDepartmentLabel(person.department)} · ${getStoreLabel(person.store)}`}
      actions={
        <>
          <AtelierButton as={Link} to={`/admin/performance/${person.employeeId}`} variant="outline" size="chip">
            Performance
          </AtelierButton>
          <AtelierButton as={Link} to={`/admin/employees/${person.employeeId}`} variant="outline" size="chip">
            Profile
          </AtelierButton>
          <AtelierButton as={Link} to="/admin/attendance" variant="outline" size="chip">
            All attendance
          </AtelierButton>
        </>
      }
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AttendanceSummary employeeId={person.employeeId} month={month} />
        <AdminPanel eyebrow="Correction" title="Adjust a record">
          <p className="mb-4 font-ui text-[11px] text-taupe">
            Corrections keep the previous value, the new value, the actor and the reason. History is never silently rewritten.
          </p>
          <CorrectionForm record={selected} actor={admin} />
        </AdminPanel>
      </div>

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-light text-ink">History</h2>
        <AttendanceHistory employeeId={person.employeeId} month={month} onMonthChange={setMonth} />
      </section>
    </AdminPage>
  );
}

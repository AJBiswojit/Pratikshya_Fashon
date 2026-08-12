import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import AdminMetricCard from "../../../components/admin/AdminMetricCard";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import DataTable from "../../../components/employee/DataTable";
import { AttendanceStatusBadge } from "../../../components/workforce/WorkforceBadges";
import { LeaveTable } from "../../../components/workforce/LeavePanel";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useWorkforce } from "../../../context/WorkforceContext";
import { ROLE_OPTIONS } from "../../../config/employeeRoles";
import { DEPARTMENT_OPTIONS, STORE_OPTIONS } from "../../../config/employeeDepartments";
import { ATTENDANCE_STATUS_OPTIONS, LEAVE_STATUS } from "../../../config/attendanceConfig";
import {
  attendanceReport,
  listVisibleAttendance,
  todayHouseSummary,
} from "../../../services/workforce/attendanceService";
import { listVisibleLeave } from "../../../services/workforce/leaveService";
import { downloadCsv, formatMinutes, formatTime, todayKey } from "../../../services/workforce/dateUtils";
import { formatPercent } from "../../../components/workforce/format";

export default function AdminAttendance() {
  const { admin } = useAdminAuth();
  const { revision } = useWorkforce();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [date, setDate] = useState(todayKey());
  const [range, setRange] = useState("monthly");

  const actor = admin;
  const summary = useMemo(() => todayHouseSummary(actor), [actor, revision]);
  const rows = useMemo(
    () => listVisibleAttendance(actor, { query, role, department, location, status, date }),
    [actor, query, role, department, location, status, date, revision]
  );
  const pendingLeave = useMemo(
    () => listVisibleLeave(actor, { status: LEAVE_STATUS.PENDING }),
    [actor, revision]
  );
  const report = useMemo(() => attendanceReport({ range, date, actor }), [range, date, actor, revision]);

  const exportReport = () => {
    downloadCsv(
      `pratikshya-attendance-${range}-${date}.csv`,
      ["Employee", "ID", "Department", "Role", "Present", "Late", "Absent", "Leave", "Hours", "Attendance %"],
      report.rows.map((row) => [
        row.name,
        row.employeeId,
        row.department,
        row.role,
        row.summary.present,
        row.summary.late,
        row.summary.absent,
        row.summary.leave,
        formatMinutes(row.summary.workMinutes),
        row.summary.attendancePercent ?? "",
      ])
    );
  };

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          House <span className="italic text-accent">attendance.</span>
        </>
      }
      description="One register for the floor. Present, late, leave and corrections all read from pratikshya_attendance."
      actions={
        <AtelierButton variant="outline" size="chip" onClick={exportReport}>
          Export report
        </AtelierButton>
      }
    >
      <section aria-label="Attendance metrics" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Total employees" value={summary.totalEmployees} hint="In scope today" />
        <AdminMetricCard label="Present today" value={summary.presentToday} hint="Present, late, half day, on duty" />
        <AdminMetricCard label="Late today" value={summary.lateToday} hint="After the house threshold" />
        <AdminMetricCard label="Absent today" value={summary.absentToday} hint="Absent or not yet in" />
        <AdminMetricCard label="On leave" value={summary.onLeave} hint={`Attendance ${formatPercent(summary.attendancePercent)}`} />
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <EmployeeField label="Search" id="adm-att-q">
          <input id="adm-att-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or employee ID" className={employeeInputClass()} />
        </EmployeeField>
        <EmployeeField label="Date" id="adm-att-date">
          <input id="adm-att-date" type="date" value={date} onChange={(event) => setDate(event.target.value)} className={employeeInputClass()} />
        </EmployeeField>
        <EmployeeField label="Role" id="adm-att-role">
          <select id="adm-att-role" value={role} onChange={(event) => setRole(event.target.value)} className={employeeInputClass()}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Department" id="adm-att-dept">
          <select id="adm-att-dept" value={department} onChange={(event) => setDepartment(event.target.value)} className={employeeInputClass()}>
            <option value="">All departments</option>
            {DEPARTMENT_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Location" id="adm-att-loc">
          <select id="adm-att-loc" value={location} onChange={(event) => setLocation(event.target.value)} className={employeeInputClass()}>
            <option value="">All floors</option>
            {STORE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Status" id="adm-att-status">
          <select id="adm-att-status" value={status} onChange={(event) => setStatus(event.target.value)} className={employeeInputClass()}>
            <option value="">All statuses</option>
            {ATTENDANCE_STATUS_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
      </div>

      <p className="mb-3 font-ui text-[11px] text-taupe" aria-live="polite">
        Showing {rows.length} records for {date}.
      </p>

      <DataTable
        rows={rows}
        rowKey="employeeId"
        empty="No attendance matches those filters."
        columns={[
          {
            id: "name",
            label: "Employee",
            render: (row) => (
              <Link to={`/admin/attendance/${row.employeeId}`} className="text-ink underline-offset-4 hover:text-accent hover:underline">
                {row.name}
              </Link>
            ),
          },
          { id: "employeeId", label: "Employee ID" },
          { id: "departmentLabel", label: "Department" },
          { id: "roleLabel", label: "Role" },
          { id: "locationLabel", label: "Location" },
          { id: "date", label: "Date" },
          { id: "checkIn", label: "Check-in", render: (row) => formatTime(row.checkIn) },
          { id: "checkOut", label: "Check-out", render: (row) => formatTime(row.checkOut) },
          { id: "hours", label: "Hours", render: (row) => (row.workMinutes ? formatMinutes(row.workMinutes) : "—") },
          { id: "status", label: "Status", render: (row) => <AttendanceStatusBadge status={row.status} /> },
        ]}
      />

      <div className="mt-10 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)]">
        <AdminPanel
          eyebrow="Leave"
          title="Pending requests"
          action={<span className="font-ui text-[11px] text-taupe">{pendingLeave.length} waiting</span>}
        >
          <LeaveTable rows={pendingLeave} actor={actor} showEmployee />
        </AdminPanel>

        <AdminPanel
          eyebrow="Reports"
          title="Attendance report"
          action={
            <select value={range} onChange={(event) => setRange(event.target.value)} className={employeeInputClass()} aria-label="Report range">
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          }
        >
          <dl className="grid grid-cols-2 gap-3">
            {[
              ["Present", report.summary.present],
              ["Late", report.summary.late],
              ["Absent", report.summary.absent],
              ["Leave", report.summary.leave],
              ["Average hours", formatMinutes(report.summary.averageMinutes)],
              ["Attendance", formatPercent(report.summary.attendancePercent)],
            ].map(([label, value]) => (
              <div key={label} className="border border-mist/70 bg-canvas/70 p-3">
                <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">{label}</dt>
                <dd className="mt-1 font-display text-xl font-light text-ink">{value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 font-ui text-[11px] text-taupe">
            {report.start} – {report.end}. Export writes a CSV from this same summary.
          </p>
        </AdminPanel>
      </div>
    </AdminPage>
  );
}

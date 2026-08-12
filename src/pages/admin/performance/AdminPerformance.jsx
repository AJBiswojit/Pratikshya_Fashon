import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminMetricCard from "../../../components/admin/AdminMetricCard";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import DataTable from "../../../components/employee/DataTable";
import { PerformanceStatusBadge } from "../../../components/workforce/WorkforceBadges";
import { formatMetricValue, formatPercent } from "../../../components/workforce/format";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useWorkforce } from "../../../context/WorkforceContext";
import { ROLE_OPTIONS } from "../../../config/employeeRoles";
import { DEPARTMENT_OPTIONS, STORE_OPTIONS } from "../../../config/employeeDepartments";
import { PERFORMANCE_STATUS_OPTIONS } from "../../../config/performanceConfig";
import { housePerformanceSummary, listVisiblePerformance } from "../../../services/workforce/performanceService";
import { downloadCsv, monthOptions, periodFromDate } from "../../../services/workforce/dateUtils";

export default function AdminPerformance() {
  const { admin } = useAdminAuth();
  const { revision } = useWorkforce();
  const [query, setQuery] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [location, setLocation] = useState("");
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState(periodFromDate().key);

  const filters = { query, role, department, location, status, period };
  const summary = useMemo(() => housePerformanceSummary(admin, period), [admin, period, revision]);
  const rows = useMemo(() => listVisiblePerformance(admin, filters), [admin, query, role, department, location, status, period, revision]);

  const exportReport = () => {
    downloadCsv(
      `pratikshya-performance-${period}.csv`,
      ["Employee", "ID", "Department", "Role", "Target", "Achievement", "Achievement %", "Attendance %", "Score", "Status"],
      rows.map((row) => {
        const headline = row.metrics[0];
        return [
          row.name,
          row.employeeId,
          row.departmentLabel,
          row.roleLabel,
          headline ? formatMetricValue(headline.targetValue, headline.unit) : "",
          headline ? formatMetricValue(headline.actualValue, headline.unit) : "",
          row.targetPercent ?? "",
          row.attendance?.attendancePercent ?? "",
          row.displayScore ?? "",
          row.status,
        ];
      })
    );
  };

  return (
    <AdminPage
      eyebrow="People"
      title={
        <>
          House <span className="italic text-accent">performance.</span>
        </>
      }
      description="Role-aware targets, achievement from live operations, and manager review. Employees cannot finalize their own score."
      actions={
        <AtelierButton variant="outline" size="chip" onClick={exportReport}>
          Export report
        </AtelierButton>
      }
    >
      <section aria-label="Performance metrics" className="mb-8 grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <AdminMetricCard label="Employees reviewed" value={summary.reviewed} hint={`${summary.total} in period`} />
        <AdminMetricCard label="Average achievement" value={formatPercent(summary.averageAchievement)} hint="Target metrics" />
        <AdminMetricCard label="Top performers" value={summary.topPerformers.length} hint="85% achievement and above" />
        <AdminMetricCard label="Needs attention" value={summary.needsAttention.length} hint="Below 60% achievement" />
        <AdminMetricCard label="Review pending" value={summary.pending} hint="Waiting on a manager" tone={summary.pending ? "alert" : "default"} />
      </section>

      <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-6">
        <EmployeeField label="Search" id="adm-perf-q">
          <input id="adm-perf-q" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Name or employee ID" className={employeeInputClass()} />
        </EmployeeField>
        <EmployeeField label="Period" id="adm-perf-period">
          <select id="adm-perf-period" value={period} onChange={(event) => setPeriod(event.target.value)} className={employeeInputClass()}>
            {monthOptions(8).map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Department" id="adm-perf-dept">
          <select id="adm-perf-dept" value={department} onChange={(event) => setDepartment(event.target.value)} className={employeeInputClass()}>
            <option value="">All departments</option>
            {DEPARTMENT_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Role" id="adm-perf-role">
          <select id="adm-perf-role" value={role} onChange={(event) => setRole(event.target.value)} className={employeeInputClass()}>
            <option value="">All roles</option>
            {ROLE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Location" id="adm-perf-loc">
          <select id="adm-perf-loc" value={location} onChange={(event) => setLocation(event.target.value)} className={employeeInputClass()}>
            <option value="">All floors</option>
            {STORE_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
        <EmployeeField label="Status" id="adm-perf-status">
          <select id="adm-perf-status" value={status} onChange={(event) => setStatus(event.target.value)} className={employeeInputClass()}>
            <option value="">All statuses</option>
            {PERFORMANCE_STATUS_OPTIONS.map((item) => (
              <option key={item.id} value={item.id}>{item.label}</option>
            ))}
          </select>
        </EmployeeField>
      </div>

      <DataTable
        rows={rows}
        rowKey="employeeId"
        empty="No performance records match those filters."
        columns={[
          {
            id: "name",
            label: "Employee",
            render: (row) => (
              <Link to={`/admin/performance/${row.employeeId}?period=${period}`} className="text-ink underline-offset-4 hover:text-accent hover:underline">
                {row.name}
              </Link>
            ),
          },
          { id: "departmentLabel", label: "Department" },
          { id: "roleLabel", label: "Role" },
          {
            id: "target",
            label: "Target",
            render: (row) => {
              const headline = row.metrics[0];
              return headline ? formatMetricValue(headline.targetValue, headline.unit) : "—";
            },
          },
          {
            id: "actual",
            label: "Achievement",
            render: (row) => {
              const headline = row.metrics[0];
              return headline ? formatMetricValue(headline.actualValue, headline.unit) : "—";
            },
          },
          { id: "targetPercent", label: "Achievement %", render: (row) => formatPercent(row.targetPercent) },
          { id: "attendance", label: "Attendance %", render: (row) => formatPercent(row.attendance?.attendancePercent) },
          { id: "score", label: "Score", render: (row) => formatPercent(row.displayScore) },
          { id: "status", label: "Status", render: (row) => <PerformanceStatusBadge status={row.status} /> },
        ]}
      />
    </AdminPage>
  );
}

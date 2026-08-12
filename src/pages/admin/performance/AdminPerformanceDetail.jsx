import { useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { AtelierButton } from "../../../design-system";
import AdminPage from "../../../components/admin/AdminPage";
import AdminPanel from "../../../components/admin/AdminPanel";
import TargetCard from "../../../components/workforce/TargetCard";
import ReviewForm, { FeedbackReadout } from "../../../components/workforce/ReviewPanel";
import AttendanceSummary from "../../../components/workforce/AttendanceSummary";
import DataTable from "../../../components/employee/DataTable";
import EmployeeField, { employeeInputClass } from "../../../components/employee/EmployeeField";
import { PerformanceStatusBadge } from "../../../components/workforce/WorkforceBadges";
import { formatPercent } from "../../../components/workforce/format";
import { useAdminAuth } from "../../../context/AdminAuthContext";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";
import { useWorkforce } from "../../../context/WorkforceContext";
import { getDepartmentLabel, getStoreLabel } from "../../../config/employeeDepartments";
import { getRoleLabel } from "../../../config/employeeRoles";
import { employeeFullName } from "../../../utils/employee";
import {
  getEmployeePerformance,
  performanceHistory,
} from "../../../services/workforce/performanceService";
import { monthOptions, periodFromDate } from "../../../services/workforce/dateUtils";

export default function AdminPerformanceDetail() {
  const { employeeId } = useParams();
  const [params] = useSearchParams();
  const { admin } = useAdminAuth();
  const { getEmployee } = useEmployeeManagement();
  const { revision } = useWorkforce();
  const [period, setPeriod] = useState(params.get("period") || periodFromDate().key);
  const person = getEmployee(employeeId);
  void revision;

  if (!person) {
    return (
      <AdminPage eyebrow="Performance" title="Employee not found">
        <AtelierButton as={Link} to="/admin/performance" size="chip">
          All performance
        </AtelierButton>
      </AdminPage>
    );
  }

  const record = getEmployeePerformance(person.employeeId, period, admin);
  const history = performanceHistory(person.employeeId, admin);

  return (
    <AdminPage
      eyebrow="Performance"
      title={employeeFullName(person)}
      description={`${person.employeeId} · ${getRoleLabel(person.role)} · ${getDepartmentLabel(person.department)} · ${getStoreLabel(person.store)}`}
      actions={
        <>
          <AtelierButton as={Link} to={`/admin/attendance/${person.employeeId}`} variant="outline" size="chip">
            Attendance
          </AtelierButton>
          <AtelierButton as={Link} to={`/admin/employees/${person.employeeId}`} variant="outline" size="chip">
            Profile
          </AtelierButton>
          <AtelierButton as={Link} to="/admin/performance" variant="outline" size="chip">
            Directory
          </AtelierButton>
        </>
      }
    >
      <div className="mb-6 max-w-xs">
        <EmployeeField label="Period" id="adm-perf-detail-period">
          <select id="adm-perf-detail-period" value={period} onChange={(event) => setPeriod(event.target.value)} className={employeeInputClass()}>
            {monthOptions(8).map((option) => (
              <option key={option.id} value={option.id}>{option.label}</option>
            ))}
          </select>
        </EmployeeField>
      </div>

      {record ? (
        <>
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <PerformanceStatusBadge status={record.status} />
            <p className="font-ui text-sm text-ink">
              Achievement {formatPercent(record.targetPercent)}
              {record.displayScore != null ? ` · score ${formatPercent(record.displayScore)}` : ""}
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {record.metrics.map((metric) => (
              <TargetCard key={metric.metric} metric={metric} />
            ))}
          </div>

          <div className="mt-8 grid gap-6 xl:grid-cols-2">
            <AttendanceSummary employeeId={person.employeeId} month={period} compact />
            <AdminPanel eyebrow="Manager review" title="Feedback">
              <ReviewForm record={record} actor={admin} canFinalize />
            </AdminPanel>
          </div>

          {record.review?.employeeComments ? (
            <AdminPanel className="mt-6" eyebrow="Employee" title="Comments">
              <FeedbackReadout review={{ employeeComments: record.review.employeeComments }} />
            </AdminPanel>
          ) : null}
        </>
      ) : (
        <p className="font-ui text-sm text-taupe">No performance record for this period.</p>
      )}

      <section className="mt-10">
        <h2 className="mb-4 font-display text-2xl font-light text-ink">History</h2>
        <DataTable
          rows={history}
          rowKey="performanceId"
          empty="No earlier periods."
          columns={[
            { id: "periodLabel", label: "Period" },
            { id: "targetPercent", label: "Achievement", render: (row) => formatPercent(row.targetPercent) },
            { id: "score", label: "Score", render: (row) => formatPercent(row.displayScore) },
            { id: "status", label: "Status", render: (row) => <PerformanceStatusBadge status={row.status} /> },
            { id: "reviewer", label: "Reviewer", render: (row) => row.review?.reviewerName || "—" },
          ]}
        />
      </section>
    </AdminPage>
  );
}

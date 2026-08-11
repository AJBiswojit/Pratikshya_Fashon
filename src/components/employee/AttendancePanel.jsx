import { useEffect, useState } from "react";
import { AtelierButton, Rule } from "../../design-system";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { formatEmployeeDateTime } from "../../utils/employee";
import StatusBadge from "./StatusBadge";

const statusCopy = {
  NOT_CHECKED_IN: { label: "Not checked in", tone: "quiet" },
  PRESENT: { label: "Present", tone: "ink" },
  ABSENT: { label: "Absent", tone: "muted" },
  ON_LEAVE: { label: "On leave", tone: "accent" },
};

export default function AttendancePanel() {
  const { employee, getAttendance, checkIn, checkOut } = useEmployeeAuth();
  const [record, setRecord] = useState(() => getAttendance());

  useEffect(() => {
    setRecord(getAttendance());
  }, [getAttendance, employee?.employeeId]);

  if (!employee) return null;

  const status = record?.status || "NOT_CHECKED_IN";
  const copy = statusCopy[status] ?? statusCopy.NOT_CHECKED_IN;

  return (
    <section className="border border-mist/80 bg-surface/40 p-6">
      <p className="font-ui text-[10px] uppercase tracking-[.2em] text-accent">Attendance</p>
      <h2 className="mt-2 font-display text-2xl font-light text-ink">Today on the floor</h2>
      <Rule width="w-8" tone="accent" className="my-3" />
      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge label={copy.label} tone={copy.tone} />
        {employee.status === "ON_LEAVE" ? (
          <StatusBadge status="ON_LEAVE" />
        ) : null}
      </div>
      <dl className="mt-5 grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">Check in</dt>
          <dd className="mt-1 font-ui text-sm text-ink">
            {record?.checkedInAt ? formatEmployeeDateTime(record.checkedInAt) : "—"}
          </dd>
        </div>
        <div>
          <dt className="font-ui text-[10px] uppercase tracking-[.16em] text-taupe">Check out</dt>
          <dd className="mt-1 font-ui text-sm text-ink">
            {record?.checkedOutAt ? formatEmployeeDateTime(record.checkedOutAt) : "—"}
          </dd>
        </div>
      </dl>
      <p className="mt-4 font-ui text-[11px] text-taupe">
        Mock attendance only. This does not connect to payroll.
      </p>
      <div className="mt-5 flex flex-wrap gap-2">
        <AtelierButton
          size="chip"
          onClick={() => setRecord(checkIn().record)}
          disabled={Boolean(record?.checkedInAt)}
        >
          Check in
        </AtelierButton>
        <AtelierButton
          variant="outline"
          size="chip"
          onClick={() => setRecord(checkOut().record)}
          disabled={!record?.checkedInAt || Boolean(record?.checkedOutAt)}
        >
          Check out
        </AtelierButton>
      </div>
    </section>
  );
}

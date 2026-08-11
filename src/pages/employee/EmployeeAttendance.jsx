import EmployeePage from "../../components/employee/EmployeePage";
import AttendancePanel from "../../components/employee/AttendancePanel";

export default function EmployeeAttendance() {
  return (
    <EmployeePage
      eyebrow="Presence"
      title={
        <>
          Today's <span className="italic text-accent">attendance.</span>
        </>
      }
      description="Check in and out for the floor. This is a mock attendance record — it does not feed payroll."
    >
      <div className="max-w-xl">
        <AttendancePanel />
      </div>
    </EmployeePage>
  );
}

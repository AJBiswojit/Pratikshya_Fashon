import EmployeePage from "../../components/employee/EmployeePage";
import PerformancePanel from "../../components/employee/PerformancePanel";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";

export default function EmployeePerformance() {
  const { employee } = useEmployeeAuth();
  return (
    <EmployeePage
      eyebrow="My performance"
      title={
        <>
          How the month is <span className="italic text-accent">reading.</span>
        </>
      }
      description="A light view of target, customers and assisted work. Not an HR analytics suite."
    >
      <div className="max-w-3xl">
        <PerformancePanel employeeId={employee?.employeeId} />
      </div>
    </EmployeePage>
  );
}

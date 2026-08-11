import EmployeePage from "../../../components/employee/EmployeePage";
import ActivityFeed from "../../../components/employee/ActivityFeed";
import { useEmployeeManagement } from "../../../context/EmployeeManagementContext";

export default function ActivityLog() {
  const { activity } = useEmployeeManagement();
  return (
    <EmployeePage
      eyebrow="House diary"
      title={
        <>
          Employee <span className="italic text-accent">activity.</span>
        </>
      }
      description="A lightweight log of people events. Not an enterprise audit trail — structured so the later Admin Portal can consume it."
    >
      <ActivityFeed entries={activity} />
    </EmployeePage>
  );
}

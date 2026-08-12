import AdminPage from "../../components/admin/AdminPage";
import ActivityFeed from "../../components/employee/ActivityFeed";
import { useEmployeeManagement } from "../../context/EmployeeManagementContext";

/**
 * /admin/activity
 *
 * The same Phase 10 activity log the Employee Portal writes to — one
 * diary, read from both portals. No second activity system.
 */
export default function AdminActivity() {
  const { activity } = useEmployeeManagement();

  return (
    <AdminPage
      eyebrow="System"
      title={
        <>
          Activity <span className="italic text-accent">log.</span>
        </>
      }
      description="People events recorded across both portals: accounts created, roles and departments changed, passwords reset, accounts suspended and activated."
    >
      <ActivityFeed entries={activity} />
      <p className="mt-6 font-ui text-[11px] text-taupe">
        A readable house diary rather than an enterprise audit trail. Credentials are
        never written to it.
      </p>
    </AdminPage>
  );
}

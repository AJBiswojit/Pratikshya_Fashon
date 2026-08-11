import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import EmployeePage from "../../components/employee/EmployeePage";
import DataTable from "../../components/employee/DataTable";
import {
  getAssistedOrders,
  getBusinessOrders,
} from "../../services/employees/operationsService";
import { formatINR } from "../../utils/shopping";
import { formatEmployeeDateTime } from "../../utils/employee";
import { PERMISSIONS } from "../../config/employeePermissions";

export default function EmployeeOrders() {
  const { employee, hasPermission } = useEmployeeAuth();
  const mineOnly = employee?.role === "SALES_EXECUTIVE";
  const floor = mineOnly ? getAssistedOrders(employee.employeeId) : getAssistedOrders();
  const house = hasPermission(PERMISSIONS.ORDERS_VIEW) ? getBusinessOrders() : [];

  return (
    <EmployeePage
      eyebrow="Orders"
      title={
        <>
          Tickets on the <span className="italic text-accent">floor.</span>
        </>
      }
      description={
        mineOnly
          ? "Assisted orders written under your employee ID."
          : "Floor tickets plus customer orders placed through the atelier checkout — the same records the account experience uses."
      }
    >
      <section className="mb-10">
        <h2 className="mb-3 font-display text-2xl font-light">Assisted tickets</h2>
        <DataTable
          rows={floor}
          columns={[
            { id: "id", label: "Ticket" },
            { id: "associate", label: "Associate" },
            { id: "customer", label: "Customer" },
            { id: "pieces", label: "Pieces" },
            { id: "amount", label: "Amount", render: (row) => formatINR(row.amount) },
            { id: "status", label: "Status" },
            { id: "createdAt", label: "When", render: (row) => formatEmployeeDateTime(row.createdAt) },
          ]}
          empty="No assisted tickets yet."
        />
      </section>

      {!mineOnly ? (
        <section>
          <h2 className="mb-3 font-display text-2xl font-light">Atelier checkout orders</h2>
          <DataTable
            rows={house}
            columns={[
              { id: "id", label: "Order" },
              { id: "customer", label: "Customer", render: (row) => row.customer?.fullName || "Guest" },
              { id: "status", label: "Status" },
              { id: "total", label: "Total", render: (row) => formatINR(row.pricing?.total) },
              { id: "createdAt", label: "Placed", render: (row) => formatEmployeeDateTime(row.createdAt) },
            ]}
            empty="No customer checkout orders in this browser yet. Place one from the storefront to see it here."
          />
        </section>
      ) : null}
    </EmployeePage>
  );
}

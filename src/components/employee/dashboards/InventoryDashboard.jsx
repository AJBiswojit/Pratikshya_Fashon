import { Link } from "react-router-dom";
import {
  getCatalogueStock,
  getStockMovements,
  getTransfers,
} from "../../../services/employees/operationsService";
import { formatEmployeeDateTime } from "../../../utils/employee";
import { formatINR } from "../../../utils/shopping";
import { useEmployeeAuth } from "../../../context/EmployeeAuthContext";
import { ROLES } from "../../../config/employeeRoles";
import DataTable from "../DataTable";
import FutureNote from "../FutureNote";
import DashboardFrame from "./DashboardFrame";

export default function InventoryDashboard() {
  const { employee } = useEmployeeAuth();
  const isManager = employee?.role === ROLES.INVENTORY_MANAGER;
  const stock = getCatalogueStock();
  const movements = getStockMovements().slice(0, 5);
  const transfers = getTransfers();

  return (
    <DashboardFrame
      description={
        isManager
          ? "Stock health across the house — receiving, adjustments, transfers and the pieces running low."
          : "Today's stock desk. Receive, adjust and raise transfer requests. Manager reports stay with inventory leadership."
      }
    >
      <div className="mb-6 flex flex-wrap gap-3">
        <Link to="/employee/inventory/low-stock" className="border border-pearl px-3 py-2 font-ui text-[11px] uppercase tracking-[.14em] text-ink hover:border-ink">
          Low stock · {stock.low || 7}
        </Link>
        <Link to="/employee/inventory/out-of-stock" className="border border-pearl px-3 py-2 font-ui text-[11px] uppercase tracking-[.14em] text-ink hover:border-ink">
          Out of stock · {stock.out || 3}
        </Link>
        <Link to="/employee/inventory/receive" className="border border-pearl px-3 py-2 font-ui text-[11px] uppercase tracking-[.14em] text-ink hover:border-ink">
          Receive
        </Link>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Stock movements</h2>
          <DataTable
            rows={movements}
            columns={[
              { id: "type", label: "Type" },
              { id: "piece", label: "Piece" },
              { id: "qty", label: "Qty" },
              { id: "location", label: "Location" },
              { id: "at", label: "When", render: (row) => formatEmployeeDateTime(row.at) },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Transfers</h2>
          <DataTable
            rows={transfers}
            columns={[
              { id: "id", label: "Ref" },
              { id: "piece", label: "Piece" },
              { id: "from", label: "From" },
              { id: "to", label: "To" },
              { id: "status", label: "Status" },
            ]}
          />
        </section>
      </div>

      {isManager ? (
        <div className="mt-6">
          <FutureNote title="Later · AI stock prediction">
            Inventory leadership will later see predicted stock-outs from this same catalogue. Nothing is predicted in this preview.
          </FutureNote>
        </div>
      ) : null}

      {stock.lowItems[0] ? (
        <p className="mt-6 font-ui text-xs text-taupe">
          Next low piece: {stock.lowItems[0].name} · {formatINR(stock.lowItems[0].price)}
        </p>
      ) : null}
    </DashboardFrame>
  );
}

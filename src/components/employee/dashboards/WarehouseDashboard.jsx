import { getWarehouseTasks } from "../../../services/employees/operationsService";
import DataTable from "../DataTable";
import DashboardFrame from "./DashboardFrame";

export default function WarehouseDashboard() {
  const incoming = getWarehouseTasks("Incoming");
  const outgoing = getWarehouseTasks("Outgoing");
  const picks = getWarehouseTasks("Pick");
  const damaged = getWarehouseTasks("Damaged");

  return (
    <DashboardFrame description="Incoming consignments, outgoing customer pieces, pick & pack, and anything held as damaged.">
      <div className="grid gap-6 xl:grid-cols-2">
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Incoming stock</h2>
          <DataTable
            rows={incoming}
            columns={[
              { id: "ref", label: "Ref" },
              { id: "detail", label: "Detail" },
              { id: "status", label: "Status" },
              { id: "eta", label: "When" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Outgoing stock</h2>
          <DataTable
            rows={outgoing}
            columns={[
              { id: "ref", label: "Ref" },
              { id: "detail", label: "Detail" },
              { id: "status", label: "Status" },
              { id: "eta", label: "When" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Pick & pack</h2>
          <DataTable
            rows={picks}
            columns={[
              { id: "ref", label: "Pick" },
              { id: "detail", label: "Piece" },
              { id: "status", label: "Status" },
              { id: "eta", label: "When" },
            ]}
          />
        </section>
        <section>
          <h2 className="mb-3 font-display text-2xl font-light text-ink">Damaged stock</h2>
          <DataTable
            rows={damaged}
            columns={[
              { id: "ref", label: "Ref" },
              { id: "detail", label: "Piece" },
              { id: "status", label: "Status" },
            ]}
          />
        </section>
      </div>
    </DashboardFrame>
  );
}

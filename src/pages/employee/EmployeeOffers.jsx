import EmployeePage from "../../components/employee/EmployeePage";
import DataTable from "../../components/employee/DataTable";
import { getOffers } from "../../services/employees/operationsService";

export default function EmployeeOffers() {
  return (
    <EmployeePage
      eyebrow="Offers"
      title={
        <>
          Eligible <span className="italic text-accent">offers.</span>
        </>
      }
      description="Live and scheduled house offers the floor may apply. Offer administration belongs to a later phase."
    >
      <DataTable
        rows={getOffers()}
        columns={[
          { id: "name", label: "Offer" },
          { id: "applies", label: "Applies to" },
          { id: "value", label: "Value" },
          { id: "status", label: "Status" },
          { id: "until", label: "Until" },
        ]}
      />
    </EmployeePage>
  );
}

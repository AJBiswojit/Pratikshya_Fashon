import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import EmployeePage from "../../components/employee/EmployeePage";
import DataTable from "../../components/employee/DataTable";
import { searchProducts } from "../../services/employees/operationsService";
import { formatINR } from "../../utils/shopping";
import { employeeInputClass } from "../../components/employee/EmployeeField";

export default function EmployeeProducts() {
  const [query, setQuery] = useState("");
  const results = useMemo(() => searchProducts(query), [query]);

  return (
    <EmployeePage
      eyebrow="Catalogue"
      title={
        <>
          Search the <span className="italic text-accent">house.</span>
        </>
      }
      description="The same catalogue the storefront uses. Availability here is what the floor can promise today."
    >
      <div className="mb-6 max-w-md">
        <label htmlFor="product-search" className="mb-2 block font-ui text-[11px] uppercase tracking-[.18em] text-ink">
          Product search
        </label>
        <input
          id="product-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Silk saree, Banarasi, PF-SARE..."
          className={employeeInputClass()}
        />
      </div>
      <DataTable
        rows={results}
        rowKey="id"
        columns={[
          { id: "name", label: "Piece" },
          { id: "sku", label: "SKU" },
          { id: "categoryLabel", label: "Category" },
          { id: "price", label: "Price", render: (row) => formatINR(row.price) },
          { id: "availabilityLabel", label: "Availability" },
          {
            id: "open",
            label: "Storefront",
            render: (row) => (
              <Link to={`/product/${row.slug}`} className="text-brass hover:text-accent">
                View
              </Link>
            ),
          },
        ]}
        empty="No pieces match that search."
      />
    </EmployeePage>
  );
}

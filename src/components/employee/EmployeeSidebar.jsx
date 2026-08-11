import { NavLink } from "react-router-dom";
import { navigationForRole } from "../../config/employeeNavigation";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { cn } from "../../utils/cn";
import { navIcon } from "./navIcons";

export default function EmployeeSidebar({ onNavigate }) {
  const { employee, hasPermission } = useEmployeeAuth();
  const items = navigationForRole(employee?.role, hasPermission);

  return (
    <nav id="employee-navigation" aria-label="Employee portal" className="flex flex-col gap-1 p-3">
      {items.map((item) => {
        const Icon = navIcon(item.icon);
        return (
          <NavLink
            key={item.id}
            to={item.to}
            end={Boolean(item.exact)}
            onClick={onNavigate}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 font-ui text-[11px] uppercase tracking-[.14em] transition-colors",
                isActive
                  ? "bg-ink text-ivory"
                  : "text-taupe hover:bg-surface hover:text-ink"
              )
            }
          >
            <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
            <span>{item.label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}

import { NavLink } from "react-router-dom";
import { ADMIN_NAV_GROUPS, MODULE_STATUS } from "../../config/adminNavigation";
import { cn } from "../../utils/cn";
import { adminNavIcon } from "./adminNavIcons";

/**
 * The Admin Portal navigation.
 *
 * Every future module is listed so the shape of the business is visible
 * from day one; modules that are not implemented yet carry a SOON marker
 * and open a premium placeholder rather than a broken page.
 */
export default function AdminSidebar({ onNavigate }) {
  return (
    <nav id="admin-navigation" aria-label="Admin portal" className="flex flex-col gap-6 p-4 pb-10">
      {ADMIN_NAV_GROUPS.map((group) => (
        <div key={group.id}>
          <p className="mb-2 px-3 font-ui text-[9px] uppercase tracking-[.22em] text-brass">
            {group.label}
          </p>
          <ul className="flex flex-col gap-0.5">
            {group.items.map((item) => {
              const Icon = adminNavIcon(item.icon);
              const soon = item.status === MODULE_STATUS.SOON;
              return (
                <li key={item.id}>
                  <NavLink
                    to={item.to}
                    end={Boolean(item.exact)}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center gap-3 px-3 py-2.5 font-ui text-[11px] uppercase tracking-[.13em] transition-colors",
                        isActive
                          ? "bg-ink text-ivory"
                          : soon
                            ? "text-taupe/80 hover:bg-surface hover:text-ink"
                            : "text-taupe hover:bg-surface hover:text-ink"
                      )
                    }
                  >
                    <Icon size={14} strokeWidth={1.5} aria-hidden="true" />
                    <span className="min-w-0 flex-1 truncate">{item.label}</span>
                    {soon ? (
                      <span className="font-ui text-[8px] uppercase tracking-[.16em] text-brass/80">
                        Soon
                      </span>
                    ) : null}
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

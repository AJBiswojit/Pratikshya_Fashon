import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { getRole } from "../../config/employeeRoles";
import { resolveActiveNavId, navigationForRole } from "../../config/employeeNavigation";
import { useEmployeeAuth } from "../../context/EmployeeAuthContext";
import { employeeFullName, employeeInitials } from "../../utils/employee";
import { cn } from "../../utils/cn";
import { navIcon } from "./navIcons";
import { useEmployeeNavBadges } from "./useEmployeeNavBadges";

const STORAGE_KEY = "pf_employee_nav_groups";

function readPersistedGroups() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed.filter(Boolean)) : null;
  } catch {
    return null;
  }
}

function writePersistedGroups(groups) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...groups]));
  } catch {
    /* storage unavailable — preference simply is not remembered */
  }
}

export default function EmployeeSidebar({ onNavigate }) {
  const { employee, hasPermission, signOut } = useEmployeeAuth();
  const { pathname } = useLocation();
  const groups = navigationForRole(employee?.role, hasPermission);
  const badges = useEmployeeNavBadges(employee);

  const activeId = useMemo(() => resolveActiveNavId(pathname, groups), [pathname, groups]);

  const activeGroupId = useMemo(() => {
    if (!groups) return null;
    for (const group of groups) {
      const hasActive = group.items.some(
        (item) =>
          item.id === activeId ||
          (Array.isArray(item.children) && item.children.some((child) => child.id === activeId))
      );
      if (hasActive) return group.id;
    }
    return null;
  }, [groups, activeId]);

  const [expanded, setExpanded] = useState(() => {
    const persisted = readPersistedGroups();
    const seed = new Set(persisted ?? []);
    if (!persisted) {
      /* Fresh visitors see Overview open; every group collapses cleanly. */
      const overview = groups?.find((group) => group.id === "overview");
      if (overview) seed.add(overview.id);
    }
    if (activeGroupId) seed.add(activeGroupId);
    return seed;
  });

  /* Persist user preference. */
  useEffect(() => {
    writePersistedGroups(expanded);
  }, [expanded]);

  /* Auto-expand the group of the current route, and keep it open while
     navigating inside it. */
  useEffect(() => {
    if (!activeGroupId) return;
    setExpanded((current) => {
      if (current.has(activeGroupId)) return current;
      const next = new Set(current);
      next.add(activeGroupId);
      return next;
    });
  }, [activeGroupId, pathname]);

  const role = getRole(employee?.role);
  const name = employeeFullName(employee);

  const toggleGroup = (groupId) => {
    setExpanded((current) => {
      const next = new Set(current);
      if (next.has(groupId)) next.delete(groupId);
      else next.add(groupId);
      return next;
    });
  };

  const isOpen = (groupId) => expanded.has(groupId);

  return (
    <div className="flex h-full min-h-0 flex-col bg-canvas">
      {/* ----------------------------------------------------------- */}
      {/* Employee identity                                            */}
      {/* ----------------------------------------------------------- */}
      <div className="border-b border-mist/70 px-4 py-4">
        <div className="flex items-center gap-3">
          {employee?.avatar ? (
            <img
              src={employee.avatar}
              alt=""
              className="h-10 w-10 shrink-0 object-cover"
            />
          ) : (
            <span
              aria-hidden="true"
              className="flex h-10 w-10 shrink-0 items-center justify-center bg-ink font-display text-sm font-light text-ivory"
            >
              {employeeInitials(employee)}
            </span>
          )}
          <div className="min-w-0">
            <p className="truncate font-display text-base font-medium leading-tight text-ink">
              {name}
            </p>
            <p className="mt-0.5 font-ui text-[10px] uppercase tracking-[.16em] text-taupe">
              {role.label}
            </p>
          </div>
        </div>
      </div>

      {/* ----------------------------------------------------------- */}
      {/* Navigation                                                   */}
      {/* ----------------------------------------------------------- */}
      <nav
        id="employee-navigation"
        aria-label="Employee portal"
        className="min-h-0 flex-1 overflow-y-auto px-2 py-3"
      >
        {groups.map((group) => {
          const GroupIcon = navIcon(group.icon);
          const open = isOpen(group.id);
          return (
            <section key={group.id} className="mb-3 last:mb-0">
              <h2 className="px-2">
                <button
                  type="button"
                  onClick={() => toggleGroup(group.id)}
                  aria-expanded={open}
                  aria-controls={`navgroup-${group.id}`}
                  className="group/heading flex w-full items-center justify-between gap-2 px-1 py-1.5 text-left"
                >
                  <span className="flex min-w-0 items-center gap-2">
                    <GroupIcon
                      size={13}
                      strokeWidth={1.5}
                      aria-hidden="true"
                      className="shrink-0 text-brass"
                    />
                    <span className="truncate font-ui text-[10px] font-medium uppercase tracking-[.18em] text-taupe group-hover/heading:text-ink">
                      {group.label}
                    </span>
                  </span>
                  <Chevron open={open} />
                </button>
              </h2>

              {open ? (
                <ul id={`navgroup-${group.id}`} className="mt-0.5 space-y-0.5">
                  {group.items.map((item) => (
                    <GroupItems
                      key={item.id}
                      item={item}
                      activeId={activeId}
                      badge={badges[item.id]}
                      onNavigate={onNavigate}
                    />
                  ))}
                </ul>
              ) : null}
            </section>
          );
        })}
      </nav>

      {/* ----------------------------------------------------------- */}
      {/* Footer — utility actions                                     */}
      {/* ----------------------------------------------------------- */}
      <div className="border-t border-mist/70 px-3 py-3">
        <ul className="space-y-0.5">
          <li>
            <Link
              to="/employee/profile"
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-3 rounded-none px-3 py-2 font-ui text-[11px] uppercase tracking-[.14em]",
                activeId === "profile"
                  ? "bg-ink text-ivory"
                  : "text-taupe hover:bg-surface hover:text-ink"
              )}
            >
              <ProfileIcon aria-hidden="true" size={14} strokeWidth={1.5} />
              <span>Profile</span>
            </Link>
          </li>
          <li>
            <button
              type="button"
              onClick={signOut}
              className="flex w-full items-center gap-3 px-3 py-2 text-left font-ui text-[11px] uppercase tracking-[.14em] text-taupe hover:bg-surface hover:text-ink"
            >
              <LogoutIcon aria-hidden="true" size={14} strokeWidth={1.5} />
              <span>Sign out</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  );
}

function Chevron({ open }) {
  const ChevronDown = navIcon("chevronDown");
  return (
    <ChevronDown
      aria-hidden="true"
      size={14}
      strokeWidth={1.5}
      className={cn(
        "shrink-0 text-taupe transition-transform duration-200",
        open ? "rotate-180" : "rotate-0"
      )}
    />
  );
}

function GroupItems({ item, activeId, badge, onNavigate }) {
  const Icon = navIcon(item.icon);
  const isActive = item.id === activeId;
  const hasChildren = Array.isArray(item.children) && item.children.length > 0;

  return (
    <li>
      <Link
        to={item.to}
        onClick={onNavigate}
        title={item.label}
        aria-current={isActive ? "page" : undefined}
        className={cn(
          "relative flex min-w-0 items-center gap-2.5 rounded-none border-l-2 py-2 pl-3 pr-2 font-ui text-[11px] uppercase tracking-[.12em] transition-colors",
          isActive
            ? "border-accent bg-ink font-medium text-ivory"
            : "border-transparent text-taupe hover:bg-surface hover:text-ink"
        )}
      >
        <Icon
          size={14}
          strokeWidth={isActive ? 2 : 1.5}
          aria-hidden="true"
          className={cn("shrink-0", isActive ? "text-accent" : "text-brass")}
        />
        <span className="min-w-0 flex-1 truncate">{item.label}</span>
        {badge > 0 ? (
          <span className="shrink-0 rounded-full bg-accent px-1.5 py-0.5 font-ui text-[9px] font-medium leading-none text-white">
            {badge}
          </span>
        ) : null}
      </Link>

      {hasChildren ? (
        <ul className="mt-0.5 space-y-0.5 border-l-2 border-mist/50 pl-4">
          {item.children.map((child) => (
            <li key={child.id}>
              <ChildLink child={child} activeId={activeId} onNavigate={onNavigate} />
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function ChildLink({ child, activeId, onNavigate }) {
  const Icon = navIcon(child.icon);
  const isActive = child.id === activeId;
  return (
    <Link
      to={child.to}
      onClick={onNavigate}
      title={child.label}
      aria-current={isActive ? "page" : undefined}
      className={cn(
        "relative flex min-w-0 items-center gap-2 rounded-none border-l-2 py-1.5 pl-3 pr-2 font-ui text-[10px] uppercase tracking-[.12em] transition-colors",
        isActive
          ? "border-accent bg-ink font-medium text-ivory"
          : "border-transparent text-taupe hover:bg-surface hover:text-ink"
      )}
    >
      <Icon
        size={12}
        strokeWidth={isActive ? 2 : 1.5}
        aria-hidden="true"
        className={cn("shrink-0", isActive ? "text-accent" : "text-brass")}
      />
      <span className="min-w-0 flex-1 truncate">{child.label}</span>
    </Link>
  );
}

const ProfileIcon = navIcon("user");
const LogoutIcon = navIcon("logout");

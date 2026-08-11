import { AnimatePresence, motion } from "framer-motion";
import { Menu } from "lucide-react";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Container,
  duration,
  header as headerSpacing,
  nav as navType,
  transition,
} from "../../design-system";
import {
  brand,
  primaryNavigation,
  utilityNavigation,
} from "../../config/navigationConfig";
import { cn } from "../../utils/cn";
import { utilityIcons } from "./utilityIcons";
import MegaMenu from "./MegaMenu";
import MobileNav from "./MobileNav";
import SearchPanel from "./SearchPanel";

/**
 * The global header.
 *
 * Reproduces the Phase 1 navigation exactly — fixed, translucent canvas,
 * blurred, hairline underneath, brand mark left, letter-spaced links right
 * — and extends it with the three things an application shell needs: a
 * mega menu on the primary groups, the utility actions, and a mobile
 * drawer.
 *
 * Only one overlay is ever open: opening the search closes the menu, and
 * navigating closes everything.
 */
export default function SiteHeader({ counts = {}, onOpenCart }) {
  const [openGroup, setOpenGroup] = useState(null);
  const [searchOpen, setSearchOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeTimer = useRef(null);
  const menuId = useId();
  const { pathname } = useLocation();

  const clearCloseTimer = () => {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  };

  const closeAll = useCallback(() => {
    clearCloseTimer();
    setOpenGroup(null);
    setSearchOpen(false);
    setDrawerOpen(false);
  }, []);

  /* Any route change dismisses every overlay. */
  useEffect(() => {
    closeAll();
  }, [pathname, closeAll]);

  useEffect(() => () => clearCloseTimer(), []);

  /* Escape closes whatever is open. */
  useEffect(() => {
    if (!openGroup && !searchOpen && !drawerOpen) return undefined;

    const onKeyDown = (event) => {
      if (event.key === "Escape") closeAll();
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openGroup, searchOpen, drawerOpen, closeAll]);

  /* The drawer owns the viewport while it is open. */
  useEffect(() => {
    if (!drawerOpen) return undefined;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, [drawerOpen]);

  /**
   * A short grace period on leaving lets the pointer cross the gap between
   * the trigger and the panel without the menu collapsing.
   */
  const scheduleClose = () => {
    clearCloseTimer();
    closeTimer.current = setTimeout(() => setOpenGroup(null), 120);
  };

  const openMenu = (id) => {
    clearCloseTimer();
    setSearchOpen(false);
    setOpenGroup(id);
  };

  const toggleSearch = () => {
    clearCloseTimer();
    setOpenGroup(null);
    setSearchOpen((open) => !open);
  };

  const activeGroup = primaryNavigation.find((group) => group.id === openGroup) ?? null;

  return (
    <header className="fixed top-0 left-0 right-0 z-50">
      <div
        className="bg-canvas/80 backdrop-blur-md border-b border-mist/50"
        onMouseLeave={scheduleClose}
      >
        <Container
          width="content"
          padded
          className={cn(headerSpacing.height, "flex items-center justify-between gap-4")}
        >
          <Link
            to={brand.home}
            className={cn(navType.brand, "hover:text-accent shrink-0", transition.colors)}
          >
            {brand.name}
          </Link>

          {/* Desktop navigation */}
          <nav
            aria-label="Primary"
            className={cn("hidden lg:flex gap-6", navType.link, "text-brass")}
          >
            {primaryNavigation.map((group) => {
              const isActive = pathname === group.to || pathname.startsWith(`${group.to}/`);
              const isOpen = openGroup === group.id;

              return (
                <Link
                  key={group.id}
                  to={group.to}
                  aria-haspopup="true"
                  aria-expanded={isOpen}
                  aria-controls={isOpen ? `${menuId}-mega` : undefined}
                  onMouseEnter={() => openMenu(group.id)}
                  onFocus={() => openMenu(group.id)}
                  className={cn(
                    "relative py-2 hover:text-accent",
                    transition.colors,
                    (isActive || isOpen) && "text-accent"
                  )}
                >
                  {group.label}
                  <span
                    aria-hidden="true"
                    className={cn(
                      "absolute -bottom-px left-0 h-px w-full origin-left bg-accent transition-transform duration-500",
                      isActive || isOpen ? "scale-x-100" : "scale-x-0"
                    )}
                  />
                </Link>
              );
            })}
          </nav>

          {/* Utility actions */}
          <div className="flex items-center gap-1 md:gap-2 text-brass">
            {utilityNavigation.map((item) => {
              const Icon = utilityIcons[item.icon];
              const count = counts[item.id];
              const isSearch = item.action === "search";
              const isCart = item.id === "cart" && typeof onOpenCart === "function";

              const content = (
                <>
                  <Icon size={17} strokeWidth={1.5} aria-hidden="true" />
                  {count > 0 && (
                    <span
                      className={cn(
                        "absolute -top-0.5 -right-0.5 min-w-4 px-1 py-px text-center",
                        "bg-accent text-white font-ui text-[9px] leading-none tracking-normal"
                      )}
                    >
                      {count}
                    </span>
                  )}
                </>
              );

              const shared = cn(
                "relative p-2 hover:text-accent",
                transition.colors,
                isSearch && "hidden sm:inline-flex",
                !isSearch && item.id === "wishlist" && "hidden sm:inline-flex"
              );

              const countLabel = count > 0 ? `${item.label}, ${count} ${count === 1 ? "item" : "items"}` : item.label;

              if (isSearch) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={toggleSearch}
                    aria-label={item.label}
                    aria-expanded={searchOpen}
                    className={shared}
                  >
                    {content}
                  </button>
                );
              }

              if (isCart) {
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      closeAll();
                      onOpenCart();
                    }}
                    aria-label={countLabel}
                    aria-haspopup="dialog"
                    onMouseEnter={scheduleClose}
                    className={shared}
                  >
                    {content}
                  </button>
                );
              }

              return (
                <Link
                  key={item.id}
                  to={item.to}
                  aria-label={countLabel}
                  onMouseEnter={scheduleClose}
                  className={shared}
                >
                  {content}
                </Link>
              );
            })}

            <button
              type="button"
              onClick={() => setDrawerOpen(true)}
              aria-label="Open menu"
              aria-expanded={drawerOpen}
              className={cn("lg:hidden p-2 hover:text-accent", transition.colors)}
            >
              <Menu size={18} strokeWidth={1.5} aria-hidden="true" />
            </button>
          </div>
        </Container>

        {/* Mega menu */}
        <AnimatePresence>
          {activeGroup && (
            <MegaMenu
              id={`${menuId}-mega`}
              group={activeGroup}
              onMouseEnter={clearCloseTimer}
              onMouseLeave={scheduleClose}
              onNavigate={closeAll}
            />
          )}
        </AnimatePresence>

        {/* Search */}
        <AnimatePresence>
          {searchOpen && <SearchPanel onClose={() => setSearchOpen(false)} />}
        </AnimatePresence>
      </div>

      {/* Scrim behind the open mega menu / search */}
      <AnimatePresence>
        {(activeGroup || searchOpen) && (
          <motion.div
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: duration.page }}
            onClick={closeAll}
            className="hidden lg:block fixed inset-0 -z-10 bg-ink/20"
          />
        )}
      </AnimatePresence>

      {/* Mobile drawer */}
      <AnimatePresence>
        {drawerOpen && <MobileNav onClose={() => setDrawerOpen(false)} counts={counts} />}
      </AnimatePresence>
    </header>
  );
}

/**
 * PRATIKSHYA FASHON — Wishlist state.
 *
 * Deliberately minimal: a set of product ids held in memory for the session,
 * so the heart on a product card can be filled and the header count is real
 * rather than a placeholder.
 *
 * There is no persistence, no server and no cart here — those belong to
 * later phases. This exists only so the storefront's save control is
 * genuinely interactive instead of decorative.
 */

import { createContext, useCallback, useContext, useMemo, useState } from "react";

const WishlistContext = createContext(null);

export function WishlistProvider({ children }) {
  const [saved, setSaved] = useState(() => new Set());

  const toggle = useCallback((product) => {
    const id = typeof product === "string" ? product : product?.id;
    if (!id) return;
    setSaved((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const value = useMemo(
    () => ({
      saved,
      count: saved.size,
      isSaved: (product) => saved.has(typeof product === "string" ? product : product?.id),
      toggle,
    }),
    [saved, toggle]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

/**
 * Wishlist accessor.
 *
 * Returns an inert wishlist when no provider is mounted, so a component can
 * be rendered in isolation without crashing.
 */
export function useWishlist() {
  return (
    useContext(WishlistContext) ?? {
      saved: new Set(),
      count: 0,
      isSaved: () => false,
      toggle: () => {},
    }
  );
}

export default WishlistContext;

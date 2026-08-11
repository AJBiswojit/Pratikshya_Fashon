/**
 * PRATIKSHYA FASHON — Wishlist state.
 *
 * Deliberately minimal: a set of product ids persisted in sessionStorage,
 * so save controls and the shell count stay in sync for the browser session.
 * There is intentionally no account or server persistence.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const WishlistContext = createContext(null);
const WISHLIST_KEY = "pratikshya-phase5-wishlist";

const readWishlist = () => {
  if (typeof window === "undefined") return new Set();
  try {
    return new Set(JSON.parse(window.sessionStorage.getItem(WISHLIST_KEY) ?? "[]"));
  } catch {
    return new Set();
  }
};

export function WishlistProvider({ children }) {
  const [saved, setSaved] = useState(readWishlist);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(WISHLIST_KEY, JSON.stringify([...saved]));
    } catch {
      // The wishlist remains fully interactive when storage is unavailable.
    }
  }, [saved]);

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

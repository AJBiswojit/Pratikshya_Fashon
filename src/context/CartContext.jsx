import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

/**
 * Lightweight Phase 5 commerce state.
 *
 * It intentionally stops at selection and cart count. There is no cart page,
 * checkout, inventory reservation or order creation in this provider.
 */
const CartContext = createContext(null);
const CART_KEY = "pratikshya-phase5-cart";
const BUY_NOW_KEY = "pratikshya-phase5-buy-now";

const readSession = (key, fallback) => {
  if (typeof window === "undefined") return fallback;
  try {
    const stored = window.sessionStorage.getItem(key);
    return stored ? JSON.parse(stored) : fallback;
  } catch {
    return fallback;
  }
};

const selectionKey = (product, selection) =>
  [product.id, selection.color ?? "", selection.size ?? ""].join(":");

const maximumQuantity = (product) => {
  if (product.availability === "unavailable") return 0;
  if (Number(product.stock) > 0) return Number(product.stock);
  return product.availability === "made-to-order" ? 5 : 1;
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    const stored = readSession(CART_KEY, []);
    return Array.isArray(stored) ? stored : [];
  });
  const [buyNowSelection, setBuyNowSelection] = useState(() => readSession(BUY_NOW_KEY, null));

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CART_KEY, JSON.stringify(items));
    } catch {
      // Session persistence is an enhancement; interaction remains available.
    }
  }, [items]);

  useEffect(() => {
    try {
      if (buyNowSelection) {
        window.sessionStorage.setItem(BUY_NOW_KEY, JSON.stringify(buyNowSelection));
      } else {
        window.sessionStorage.removeItem(BUY_NOW_KEY);
      }
    } catch {
      // Keep the in-memory selection when storage is unavailable.
    }
  }, [buyNowSelection]);

  const addItem = useCallback((product, selection) => {
    if (!product?.id) return;
    const maximum = maximumQuantity(product);
    if (maximum === 0) return;
    const quantity = Math.min(maximum, Math.max(1, Number(selection.quantity) || 1));
    const key = selectionKey(product, selection);

    setItems((current) => {
      const existing = current.find((item) => item.key === key);
      if (existing) {
        return current.map((item) =>
          item.key === key
            ? { ...item, maximum, quantity: Math.min(maximum, item.quantity + quantity) }
            : item
        );
      }
      return [
        ...current,
        {
          key,
          productId: product.id,
          slug: product.slug,
          name: product.name,
          price: product.price,
          color: selection.color ?? null,
          size: selection.size ?? null,
          maximum,
          quantity,
        },
      ];
    });
  }, []);

  const prepareBuyNow = useCallback((product, selection) => {
    if (!product?.id || maximumQuantity(product) === 0) return;
    setBuyNowSelection({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      color: selection.color ?? null,
      size: selection.size ?? null,
      quantity: Math.min(
        maximumQuantity(product),
        Math.max(1, Number(selection.quantity) || 1)
      ),
    });
  }, []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((total, item) => total + item.quantity, 0),
      addItem,
      prepareBuyNow,
      buyNowSelection,
    }),
    [items, addItem, prepareBuyNow, buyNowSelection]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  return (
    useContext(CartContext) ?? {
      items: [],
      count: 0,
      addItem: () => {},
      prepareBuyNow: () => {},
      buyNowSelection: null,
    }
  );
}

export default CartContext;

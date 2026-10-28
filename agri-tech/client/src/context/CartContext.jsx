import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const CartContext = createContext(null);
const STORAGE_KEY = 'agri_cart';

const load = () => {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
};

// Cart lines keep a snapshot for display only — the server always re-prices from the database.
export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); } catch { /* storage unavailable */ }
  }, [items]);

  const add = useCallback((resource, quantity = 1) => {
    setItems((list) => {
      const existing = list.find((line) => line.id === resource._id);
      const max = resource.stock || 1000;
      if (existing) return list.map((line) => (line.id === resource._id ? { ...line, quantity: Math.min(line.quantity + quantity, max) } : line));
      return [...list, { id: resource._id, name: resource.name, unit: resource.unit, price: resource.price, imageUrl: resource.imageUrl, stock: resource.stock, quantity: Math.min(quantity, max) }];
    });
  }, []);

  const setQuantity = useCallback((id, quantity) => {
    setItems((list) => list.map((line) => (line.id === id ? { ...line, quantity: Math.max(1, Math.min(quantity, line.stock || 1000)) } : line)));
  }, []);

  const remove = useCallback((id) => setItems((list) => list.filter((line) => line.id !== id)), []);
  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      open,
      setOpen,
      add,
      setQuantity,
      remove,
      clear,
      count: items.reduce((sum, line) => sum + line.quantity, 0),
      total: items.reduce((sum, line) => sum + line.price * line.quantity, 0),
    }),
    [items, open, add, setQuantity, remove, clear]
  );
  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export const useCart = () => useContext(CartContext);
